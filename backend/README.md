# Civitas Backend

Backend Node.js API for Civitas identity, owner provisioning, operational runtime, and worker orchestration.

## Quick start

1. Copy the environment file.

```bash
cp .env.example .env
```

2. Fill the canonical backend variables.

```env
NODE_ENV=production
API_URL=https://civitas.didaxus.com/api
LOGTO_API_RESOURCE=urn:civitas:api
LOGTO_M2M_CLIENT_ID=replace-with-logto-m2m-application-id
LOGTO_M2M_CLIENT_SECRET=replace-with-logto-m2m-application-secret
DATABASE_URL=postgresql://civitas:change-me@postgres:5432/civitas
REDIS_URL=redis://redis:6379/0
BULLMQ_PREFIX=civitas
WORKER_CONCURRENCY=1
ENABLE_QUEUE_RECONCILER=true
ENABLE_DB_POLL_EXECUTION=false
RUN_MIGRATIONS_ON_STARTUP=false
DATABASE_WAIT_TIMEOUT_MS=60000
DATABASE_WAIT_INTERVAL_MS=2000
DATABASE_CONNECT_TIMEOUT_MS=5000
```

3. Install dependencies.

```bash
npm install
```

4. Start the API.

```bash
npm run dev
```

5. Start the worker when needed.

```bash
npm run worker
```

## Notes

- `DATABASE_URL` is the only allowed PostgreSQL connection variable.
- `REDIS_URL` is the only allowed Redis connection variable.
- `API_URL` and `LOGTO_API_RESOURCE` must match `dist/auth.contract.json`; `LOGTO_API_RESOURCE` must be `urn:civitas:api`, never a URL.
- Backend env provides infrastructure, M2M credentials, and contract-mirrored public API/audience values only.
- `LOGTO_M2M_CLIENT_ID` and `LOGTO_M2M_CLIENT_SECRET` must be backend M2M credentials, not the frontend SPA application ID.
- Backend and worker do not consume `VITE_*` variables.


## Database migrations

`DATABASE_URL` is the only PostgreSQL connection source used by the API and worker. The operational orchestration table `operational_operations` is defined in `db/schema/index.js` and created by `db/migrations/0000_foundation.sql`. It stores local Civitas operational state, queue coordination, retries and audit linkage; it is not a copy of Logto organizations or memberships.

Apply migrations before starting production services:

```bash
npm run db:migrate:sql
```

If a deployment needs the service to apply idempotent SQL migrations during startup, set `RUN_MIGRATIONS_ON_STARTUP=true` for a controlled single-instance bootstrap or maintenance rollout. API and worker will then run the SQL files in `db/migrations` and fail startup if `operational_operations`, `operational_operation_steps` or `audit_logs` are missing required columns. Keep this flag `false` during normal multi-replica runtime after migrations have been applied.
