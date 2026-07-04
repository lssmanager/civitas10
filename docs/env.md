# Civitas10 environment variables

The project uses a single source of truth for each service configuration value. Frontend values are Vite build-time variables only. Backend and worker runtime values never use `VITE_*`. PostgreSQL and Redis are represented only by `DATABASE_URL` and `REDIS_URL`.

## Frontend only

```env
VITE_API_URL=https://civitas.didaxus.com/api
VITE_API_RESOURCE=https://civitas.didaxus.com/api
VITE_LOGTO_ENDPOINT=https://auth.didaxus.com
VITE_LOGTO_APP_ID=replace-with-logto-spa-app-id
VITE_APP_REDIRECT_URI=https://civitas.didaxus.com/callback
VITE_APP_SIGNOUT_REDIRECT_URI=https://civitas.didaxus.com
```

## Backend/API and worker

```env
NODE_ENV=production
API_URL=https://civitas.didaxus.com/api
LOGTO_ENDPOINT=https://auth.didaxus.com
LOGTO_CLIENT_ID=replace-with-logto-m2m-client-id
LOGTO_CLIENT_SECRET=replace-with-logto-m2m-client-secret
LOGTO_MANAGEMENT_API_RESOURCE=replace-with-exact-logto-management-api-resource-indicator
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

## Logto separation

`VITE_LOGTO_APP_ID` is the public SPA app ID used by the browser. `LOGTO_CLIENT_ID` and `LOGTO_CLIENT_SECRET` are backend-only M2M credentials used for owner provisioning and Logto Management API calls. Do not reuse the SPA app ID as the backend M2M client.

`LOGTO_ENDPOINT` and `VITE_LOGTO_ENDPOINT` are always the base tenant URL (`https://auth.didaxus.com`). Civitas derives OIDC/JWKS/token endpoint URLs from that base, but the Management API token resource is configured explicitly with `LOGTO_MANAGEMENT_API_RESOURCE`.

`LOGTO_MANAGEMENT_API_RESOURCE` is the exact resource indicator of the built-in “Logto Management API” resource in the Logto Console. Copy it exactly; do not infer it from `LOGTO_ENDPOINT`. A mismatch causes Logto to reject the M2M token request with `oidc.invalid_target` / `Invalid resource indicator`.


## Database migrations

`DATABASE_URL` is the only PostgreSQL connection source for both backend and worker. The local operational backbone tables, including `operational_operations`, are defined in `backend/db/schema/index.js` and created by `backend/db/migrations/0000_foundation.sql`.

Deploys must run migrations before exposing owner operational endpoints:

```bash
cd backend
npm run db:migrate:sql
```

`RUN_MIGRATIONS_ON_STARTUP=true` is available for controlled single-instance bootstrap or maintenance deploys. When enabled, API and worker apply the idempotent SQL migrations and then validate the required operational tables/columns before starting. Leave it `false` for normal multi-replica runtime once migrations have already been applied.

## Deployment cleanup

Remove older platform-discovered helper names from Coolify. They are not application configuration for Civitas, and this repository intentionally does not expose them through compose, Dockerfiles, examples, or runtime loaders. If Coolify still displays them after this change, recreate or force-resync the service so cached metadata is discarded.
