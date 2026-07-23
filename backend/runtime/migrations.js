"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { getPool } = require("../lib/db");

const MIGRATIONS_DIR = path.join(__dirname, "..", "db", "migrations");

const REQUIRED_OPERATIONAL_SCHEMA = Object.freeze({
  operational_operations: Object.freeze([
    "id",
    "logto_organization_id",
    "operation_type",
    "entity_type",
    "entity_id",
    "status",
    "priority",
    "input_json",
    "output_json",
    "last_error_json",
    "attempts",
    "max_attempts",
    "next_retry_at",
    "claimed_by",
    "claimed_at",
    "queue_name",
    "job_id",
    "idempotency_key",
    "completed_at",
    "created_at",
    "updated_at",
  ]),
  operational_operation_steps: Object.freeze([
    "id",
    "operation_id",
    "step_name",
    "status",
    "queue_name",
    "job_id",
    "input_json",
    "output_json",
    "last_error_json",
    "started_at",
    "completed_at",
    "created_at",
    "updated_at",
  ]),
  organization_provisioning_drafts: Object.freeze([
    "idempotency_key",
    "current_stage",
    "stage_payloads",
    "consolidated_payload",
    "actor_json",
    "status",
    "submit_status",
    "logto_organization_id",
    "last_error_json",
    "submitted_at",
    "created_at",
    "updated_at",
  ]),
  audit_logs: Object.freeze(["id", "logto_organization_id", "actor_type", "action", "target_type", "target_id", "result", "metadata", "created_at"]),
  module_catalog: Object.freeze(["module_id", "kind", "business_owner", "catalog_status", "catalog_version", "catalog_hash", "provenance", "created_at", "updated_at"]),
  module_versions: Object.freeze(["id", "module_id", "semantic_version", "manifest_schema_version", "manifest_hash", "deployment_mode", "contract_status", "data_ownership", "contract_refs", "compatibility_policy", "manifest_snapshot", "provenance", "published_at", "created_at", "updated_at"]),
  organization_modules: Object.freeze(["id", "logto_organization_id", "module_id", "module_version_id", "lifecycle", "version", "actor_logto_user_id", "reason", "correlation_id", "operational_provenance", "installed_at", "lifecycle_updated_at", "created_at", "updated_at"]),
  module_runtime_catalog: Object.freeze(["id", "runtime_id", "module_id", "module_owner", "deployment_mode", "service_ref", "runtime_contract_version", "expected_audience", "service_identity_required", "health_policy", "secrets_ref", "compatibility_metadata", "runtime_status", "provenance", "version", "created_at", "updated_at"]),
  module_contract_compatibility: Object.freeze(["id", "module_version_id", "runtime_id", "host_contract_version", "runtime_contract_version", "ui_contract_version", "compatibility_status", "compatibility_range", "policy", "evidence", "provenance", "created_at", "updated_at"]),
  organization_module_runtime_bindings: Object.freeze(["id", "logto_organization_id", "organization_module_id", "runtime_id", "module_id", "selected_contract_version", "expected_contract_version", "status", "is_executable", "version", "actor_logto_user_id", "reason", "correlation_id", "operational_config", "provenance", "created_at", "updated_at"]),
  module_health_snapshots: Object.freeze(["id", "logto_organization_id", "target_type", "target_binding_id", "module_id", "capability_id", "observed_state", "observed_at", "expires_at", "version", "sanitized_reason", "provenance", "created_at"]),
  module_circuit_states: Object.freeze(["id", "logto_organization_id", "target_type", "target_binding_id", "module_id", "capability_id", "state", "version", "provenance", "created_at", "updated_at"]),
  integration_event_schema_registry: Object.freeze(["event_type", "schema_version", "owning_module_id", "owning_capability_id", "lifecycle", "sensitivity", "payload_schema", "allowed_consumers", "compatibility_status", "retention_class", "max_payload_bytes", "redaction_policy", "producer_contract", "created_at", "updated_at"]),
  integration_outbox_events: Object.freeze(["id", "event_id", "event_type", "schema_version", "logto_organization_id", "aggregate_type", "aggregate_id", "actor_json", "correlation_id", "causation_id", "source_json", "sensitivity", "payload", "state", "attempt_count", "max_attempts", "next_attempt_at", "lease_owner", "lease_expires_at", "last_error_class", "published_at", "dead_lettered_at", "version", "created_at", "updated_at"]),
  integration_inbox_receipts: Object.freeze(["id", "consumer_id", "event_id", "event_type", "schema_version", "logto_organization_id", "state", "attempt_count", "lease_owner", "lease_expires_at", "first_received_at", "last_received_at", "processed_at", "result_digest", "result_reference", "error_class", "correlation_id", "causation_id", "version"]),
  integration_dead_letters: Object.freeze(["id", "source_kind", "source_id", "event_id", "event_type", "schema_version", "logto_organization_id", "consumer_id", "attempt_count", "terminal_reason_code", "failure_json", "correlation_id", "reconciliation_status", "version", "created_at", "updated_at"]),
});

class DatabaseMigrationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "DatabaseMigrationError";
    this.code = "DATABASE_MIGRATION_FAILED";
    this.details = details;
  }
}

class DatabaseSchemaError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "DatabaseSchemaError";
    this.code = "DATABASE_SCHEMA_INVALID";
    this.details = details;
  }
}

function shouldRunMigrations(env = process.env) {
  return String(env.RUN_MIGRATIONS_ON_STARTUP || "false").toLowerCase() === "true";
}

async function listMigrationFiles() {
  const entries = await fs.readdir(MIGRATIONS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => path.join(MIGRATIONS_DIR, entry.name))
    .sort();
}

function schemaExpectationForMigration(file) {
  if (path.basename(file) === "0017_module_control_plane.sql") {
    return "module control plane tables preserve foundation primitives and add tenant-scoped module lifecycle/runtime binding contracts";
  }
  if (path.basename(file) === "0016_authorization_scope_assignments_contract.sql") {
    return "authorization_scope_assignments persists lifecycle in status; state is not required; 0013/0014 already provide membership_id, canonical_role_id and template columns";
  }
  return "migration SQL must be idempotent and leave the public schema compatible with subsequent migrations";
}

async function runSqlMigrations({ pool = getPool(), logger = console } = {}) {
  const files = await listMigrationFiles();
  const applied = [];
  for (const file of files) {
    const sql = await fs.readFile(file, "utf8");
    const migration = path.basename(file);
    try {
      await pool.query(sql);
    } catch (error) {
      throw new DatabaseMigrationError(`Backend startup failed while applying migration ${migration}: ${error.message}`, {
        migration,
        postgresCode: error.code || null,
        statementPhase: "apply migration SQL",
        schemaExpectation: schemaExpectationForMigration(file),
        position: error.position || null,
        detail: error.detail || null,
      });
    }
    applied.push(migration);
    logger.log(JSON.stringify({ component: "database-migrations", status: "applied", migration }));
  }
  return { applied };
}

async function runSqlMigrationsIfEnabled(options = {}) {
  if (!shouldRunMigrations(options.env || process.env)) return { skipped: true, reason: "RUN_MIGRATIONS_ON_STARTUP is not true" };
  return runSqlMigrations(options);
}

async function loadPublicColumns({ pool = getPool(), tables = Object.keys(REQUIRED_OPERATIONAL_SCHEMA) } = {}) {
  const result = await pool.query(
    `select table_name, column_name
       from information_schema.columns
      where table_schema = 'public'
        and table_name = any($1::text[])
      order by table_name, ordinal_position`,
    [tables],
  );
  const columnsByTable = new Map();
  for (const row of result.rows) {
    if (!columnsByTable.has(row.table_name)) columnsByTable.set(row.table_name, new Set());
    columnsByTable.get(row.table_name).add(row.column_name);
  }
  return columnsByTable;
}

async function assertOperationalSchema({ pool = getPool() } = {}) {
  const columnsByTable = await loadPublicColumns({ pool });
  const missingTables = [];
  const missingColumns = {};

  for (const [table, columns] of Object.entries(REQUIRED_OPERATIONAL_SCHEMA)) {
    const actual = columnsByTable.get(table);
    if (!actual) {
      missingTables.push(table);
      continue;
    }
    const missing = columns.filter((column) => !actual.has(column));
    if (missing.length) missingColumns[table] = missing;
  }

  if (missingTables.length || Object.keys(missingColumns).length) {
    throw new DatabaseSchemaError("Civitas operational database schema is not ready. Run backend migrations before starting API/worker.", {
      missingTables,
      missingColumns,
      expectedMigration: "backend/db/migrations/0000_foundation.sql",
      runMigrationsOnStartup: shouldRunMigrations(),
    });
  }

  return { ok: true, checkedTables: Object.keys(REQUIRED_OPERATIONAL_SCHEMA) };
}

async function prepareOperationalDatabase(options = {}) {
  const migrations = await runSqlMigrationsIfEnabled(options);
  const schema = await assertOperationalSchema(options);
  return { migrations, schema };
}

module.exports = {
  DatabaseMigrationError,
  DatabaseSchemaError,
  REQUIRED_OPERATIONAL_SCHEMA,
  assertOperationalSchema,
  prepareOperationalDatabase,
  runSqlMigrations,
  runSqlMigrationsIfEnabled,
  shouldRunMigrations,
};
