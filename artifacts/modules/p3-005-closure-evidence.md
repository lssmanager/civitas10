# P3-005 closure evidence

- Branch: `codex/issue-176-persist-module-lifecycle-runtime-bindings`
- HEAD at evidence authoring: `09fcf34ac1f44f60dfc5e0995c572e82cd5bc257`
- origin/main: `141ac39df5e199e7bef99a6959a9f3563c15961a`
- Merge-base with origin/main: `141ac39df5e199e7bef99a6959a9f3563c15961a`
- Catalog hash: `48be8d3d93d233f4c9d4dc5122014680556fcfe76328ec8b49ea5275c2cf60e4`
- Migration: `backend/db/migrations/0017_module_control_plane.sql`

## Repository and production wiring

P3-005 now separates the repository contract from implementations:

- PostgreSQL production adapter: `createPostgresModuleControlPlaneRepository`
- Production composition: `createProductionModuleControlPlaneService`
- Explicit test double only: `createInMemoryModuleControlPlaneRepository`
- Generic service construction without a repository fails with `MODULE_CONTROL_PLANE_REPOSITORY_REQUIRED`
- The offline guard `npm run modules:p3-005:no-memory-fallback-check` fails if a productive in-memory fallback is reintroduced.

## PostgreSQL persistence gate

The required real persistence gate is:

```bash
DATABASE_URL=<isolated-postgres-test-db> npm run modules:p3-005:postgres-check
```

Latest local PostgreSQL gate execution: **passed** against `PostgreSQL 16.14`. The gate requires `DATABASE_URL`. It applies SQL migrations to a real PostgreSQL database, executes schema guards, re-runs migrations for idempotence, verifies persistence after service/repository re-instantiation, validates two-tenant isolation, proves SQL optimistic concurrency, and verifies audit/outbox rollback behavior.

## Evidence paths

- PostgreSQL integration tests: `backend/integration/module-control-plane-postgres.integration.test.js`
- Production wiring and repository-required contract: `backend/test/module-control-plane-contract.test.js`
- Schema guard expectations: `backend/runtime/migrations.js`
- CI PostgreSQL service container: `.github/workflows/authorization-contract.yml`

## Redaction

No database URL, credentials, tokens, resolved secrets, or production identifiers are recorded in this evidence artifact.
