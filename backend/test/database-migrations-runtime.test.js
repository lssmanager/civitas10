const test = require("node:test");
const assert = require("node:assert/strict");

const {
  REQUIRED_OPERATIONAL_SCHEMA,
  assertOperationalSchema,
  shouldRunMigrations,
} = require("../runtime/migrations");
const { classifyDatabaseError, sanitizeDatabaseError } = require("../lib/db");

test("operational schema guard requires operational_operations columns queried by owner endpoints", async () => {
  assert.ok(REQUIRED_OPERATIONAL_SCHEMA.operational_operations.includes("logto_organization_id"));
  assert.ok(REQUIRED_OPERATIONAL_SCHEMA.operational_operations.includes("queue_name"));
  assert.ok(REQUIRED_OPERATIONAL_SCHEMA.operational_operations.includes("updated_at"));

  const pool = {
    async query() {
      return {
        rows: REQUIRED_OPERATIONAL_SCHEMA.operational_operations
          .filter((column) => column !== "queue_name")
          .map((column) => ({ table_name: "operational_operations", column_name: column })),
      };
    },
  };

  await assert.rejects(() => assertOperationalSchema({ pool }), (error) => {
    assert.equal(error.name, "DatabaseSchemaError");
    assert.deepEqual(error.details.missingTables.sort(), ["audit_logs", "operational_operation_steps"].sort());
    assert.deepEqual(error.details.missingColumns.operational_operations, ["queue_name"]);
    assert.equal(error.details.expectedMigration, "backend/db/migrations/0000_foundation.sql");
    return true;
  });
});

test("migration startup flag is explicit and database errors are classified without secrets", () => {
  assert.equal(shouldRunMigrations({ RUN_MIGRATIONS_ON_STARTUP: "true" }), true);
  assert.equal(shouldRunMigrations({ RUN_MIGRATIONS_ON_STARTUP: "false" }), false);
  assert.equal(classifyDatabaseError({ code: "42P01" }), "relation_does_not_exist");
  assert.equal(classifyDatabaseError({ code: "42703" }), "column_does_not_exist");
  assert.deepEqual(sanitizeDatabaseError({ message: "relation missing", code: "42P01", table: "operational_operations", password: "secret" }), {
    message: "relation missing",
    code: "42P01",
    table: "operational_operations",
  });
});

test("foundation migration is safe for existing connector binding tables before capability backfill", async () => {
  const fs = require("node:fs/promises");
  const path = require("node:path");
  const foundationSql = await fs.readFile(path.join(__dirname, "..", "db", "migrations", "0000_foundation.sql"), "utf8");
  const addColumnIndex = foundationSql.indexOf("add column if not exists capability_id");
  const orgCapabilityIndex = foundationSql.indexOf("registry_bindings_org_capability_idx");

  assert.ok(addColumnIndex > 0, "0000 must repair pre-existing bindings tables before indexes use capability_id");
  assert.ok(orgCapabilityIndex > addColumnIndex, "capability_id must exist before registry_bindings_org_capability_idx is created");
});

test("connector capability migration validates backfill before enforcing not null", async () => {
  const fs = require("node:fs/promises");
  const path = require("node:path");
  const migrationSql = await fs.readFile(path.join(__dirname, "..", "db", "migrations", "0001_connector_org_capability_resolution.sql"), "utf8");
  const validationIndex = migrationSql.indexOf("existing bindings cannot be backfilled");
  const notNullIndex = migrationSql.indexOf("alter column capability_id set not null");

  assert.ok(validationIndex > 0, "0001 must raise an operable error for unbackfillable bindings");
  assert.ok(notNullIndex > validationIndex, "0001 must validate backfill before enforcing NOT NULL");
});
