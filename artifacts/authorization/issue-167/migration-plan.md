# Issue 167 reversible migration plan

No stages were executed.

## Etapa 0 — Verification
Confirm consumers, owners, Logto read-only state, blockers, and frozen hashes.

## Etapa 1 — Alias
Introduce explicit aliases while retaining current IDs with observability and rollback.

## Etapa 2 — Consumer migration
Migrate consumers one by one, keep compatibility, measure use, block new legacy consumers.

## Etapa 3 — Deprecation
Mark deprecated, emit warnings, retain rollback, verify zero new assignments.

## Etapa 4 — Zero-consumer verification
Check backend, frontend, screens/actions, routes, OpenAPI, registries, role assignments, and Logto.

## Etapa 5 — Removal
Only after zero consumers, zero assignments, zero runtime/frontend/Logto usage, rollback documented, and explicit approval.
