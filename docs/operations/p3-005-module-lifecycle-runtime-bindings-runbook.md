# P3-005 module lifecycle and runtime bindings runbook

## Pre-deploy checks

1. Confirm ADR-003 is `Accepted` and P3-002 catalog checks pass: `npm run modules:catalog:check`.
2. Run read-only reconciliation preflight: `node scripts/modules/p3-005-preflight.mjs`.
3. Verify no blockers in `artifacts/modules/p3-005-migration-reconciliation.json`.
4. Take a PostgreSQL backup covering `registry_*`, `organization_runtime_state`, `operational_operations`, `audit_logs`, and all `module_*` tables.

## Migration order

1. Stop module-control-plane writers and background jobs that could transition organization module lifecycle.
2. Apply SQL migrations through the existing migration runner.
3. Run schema guard and module catalog validator.
4. Seed/read module catalog data from `contracts/modules/module-catalog.v2.json`; do not create a second authored catalog.
5. Re-run preflight and review ambiguous rows manually before any future backfill.

## Go/no-go criteria

Go only when schema guards pass, catalog hash matches the generated P3-002 inventory, preflight blockers are empty, no secret-like payloads are present, and audit/outbox hooks are available. No-go if compatibility is `verification_required`, `incompatible`, or if any tenant/runtime mapping is ambiguous.

## Post-deploy checks

- Confirm `module_catalog`, `module_versions`, `organization_modules`, `module_runtime_catalog`, `organization_module_runtime_bindings`, and `module_contract_compatibility` exist.
- Confirm foundation primitives remain readable and keep their current ownership.
- Confirm two organizations can hold separate module installations and bindings.
- Confirm suspended/decommissioning modules are unavailable.

## Reconciliation

Ambiguous historical records are blocked individually and require explicit mapping evidence. Never infer module identity from providers such as Ágora, Moodle, Canvas, Plasma, Stripe, or OpenAI. Never infer tenant identity because only one organization exists.

## Stop writers and suspend bindings

Disable application paths that call lifecycle or runtime binding services. To stop execution without deleting history, transition affected `organization_module_runtime_bindings` to `suspended` and keep `organization_modules` history intact.

## Rollback and forward fix

Rollback prioritizes stopping writers, suspending bindings, reverting application code, preserving schema/data, and applying a forward fix. Do not use destructive `DROP` as the primary rollback. If a migration partially applies, keep audit/history, capture the failing migration and PostgreSQL code, and apply an additive correction migration.

## Decommissioning criteria

Use `decommissioning` only after execution is stopped, bindings are suspended or removed non-destructively, audit evidence exists, and tenant history retention has been confirmed.

## PostgreSQL repository closure gate

P3-005 production wiring must use `createProductionModuleControlPlaneService`,
which constructs `createPostgresModuleControlPlaneRepository` over the canonical
PostgreSQL connection. `createModuleControlPlaneService` requires an explicit
repository and fails with `MODULE_CONTROL_PLANE_REPOSITORY_REQUIRED` when no
repository is provided. `createInMemoryModuleControlPlaneRepository` is a test
double only and must never be selected by API or worker startup.

### Migration and schema verification

1. Back up the target PostgreSQL database.
2. Stop module-control-plane writers before schema rollout.
3. Run the SQL migration command used by the deployment environment, or locally:
   `RUN_MIGRATIONS_ON_STARTUP=true DATABASE_URL=<postgres> node backend/scripts/run-sql-migrations.js`.
4. Verify startup schema guards with `assertOperationalSchema`; the API/worker
   must not report healthy if any of `module_catalog`, `module_versions`,
   `organization_modules`, `module_runtime_catalog`,
   `module_contract_compatibility`, or
   `organization_module_runtime_bindings` is missing a critical column.
5. Run the real PostgreSQL closure gate:
   `DATABASE_URL=<isolated-postgres-test-db> npm run modules:p3-005:postgres-check`.

### No-memory fallback invariant

Run `npm run modules:p3-005:no-memory-fallback-check` before release. The check
fails if a productive in-memory fallback is reintroduced. Unit tests may still
inject the in-memory repository explicitly as a test double.

### Audit and outbox verification

Each governed mutation runs in one PostgreSQL transaction that includes state
change, `audit_logs`, and an `operational_operations` outbox/invalidation hook.
If audit or the hook fails, the state change must roll back. Payloads redact
`secretsRef` and reject secret-like operational data before persistence.

### Suspending bindings

To stop runtime execution without deleting history, call the module control-plane
service binding suspension path with the tenant identity, binding ID, expected
version, actor, and reason. The SQL update is scoped by organization and binding
version and increments the version atomically.

### Rollback and forward-fix

Rollback prioritizes stopping writers, suspending executable bindings, reverting
application code, preserving schema/data/audit history, and applying a forward fix.
Do not drop module control-plane tables as the primary rollback mechanism after
production data exists.
