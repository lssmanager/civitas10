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
