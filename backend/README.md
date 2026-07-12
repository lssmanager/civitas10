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
LOGTO_API_RESOURCE=https://civitas.didaxus.com/api
LOGTO_MANAGEMENT_API_RESOURCE=https://auth.didaxus.com/api
LOGTO_M2M_CLIENT_ID=replace-with-logto-m2m-application-id
LOGTO_M2M_CLIENT_SECRET=replace-with-logto-m2m-application-secret
DATABASE_URL=postgresql://civitas:change-me@postgres:5432/civitas
REDIS_URL=redis://redis:6379/0
BULLMQ_PREFIX=civitas
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
- `API_URL` and `LOGTO_API_RESOURCE` must match `dist/auth.contract.json`; `LOGTO_API_RESOURCE` must be `https://civitas.didaxus.com/api`, never a URN or alternate URL.
- Backend env provides infrastructure, M2M credentials, and contract-mirrored public API/audience values only.
- `LOGTO_M2M_CLIENT_ID` and `LOGTO_M2M_CLIENT_SECRET` must be backend M2M credentials, not the frontend SPA application ID. Set `LOGTO_MANAGEMENT_API_RESOURCE` separately for the Logto Management API M2M token audience; never derive it from `LOGTO_ENDPOINT` or `VITE_LOGTO_ENDPOINT`.
- Backend and worker do not consume `VITE_*` variables.


## Database migrations

`DATABASE_URL` is the only PostgreSQL connection source used by the API and worker. The operational orchestration table `operational_operations` is defined in `db/schema/index.js` and created by `db/migrations/0000_foundation.sql`. It stores local Civitas operational state, queue coordination, retries and audit linkage; it is not a copy of Logto organizations or memberships.

Apply migrations before starting production services:

```bash
npm run db:migrate:sql
```

If a deployment needs the service to apply idempotent SQL migrations during startup, set `RUN_MIGRATIONS_ON_STARTUP=true` for a controlled single-instance bootstrap or maintenance rollout. API and worker will then run the SQL files in `db/migrations` and fail startup if `operational_operations`, `operational_operation_steps` or `audit_logs` are missing required columns. Keep this flag `false` during normal multi-replica runtime after migrations have been applied.

## Backend container build boundary

The backend image is built from the repository root (`docker-compose.yml` uses `build.context: .`) with `backend/Dockerfile`. The image intentionally keeps backend code at `/app` and packages the shared runtime contract at `/core` plus compiled contract artifacts at `/dist`.

Backend runtime code may only reach outside `backend/` for the canonical shared contract/deployment runtime under `core/` (and generated contract artifacts under `dist/`). Do not add ad-hoc copies of the deployment kernel or auth contract inside `backend/`; run `npm run test:runtime-boundary` to verify that relative runtime imports remain packageable in the container.

## Geographic reference catalog

Civitas stores the geographic catalog (`location_countries`, `location_states`, `location_cities`) as local PostgreSQL reference data. It is not Logto identity data, it is not `organization_runtime_state`, and it is not resolved through runtime connectors. Organization provisioning may carry catalog IDs plus textual snapshots in operational payloads, but Logto remains canonical for organizations and memberships.

Dataset source: [`dr5hn/countries-states-cities-database`](https://github.com/dr5hn/countries-states-cities-database). The importer uses the upstream JSON files as a controlled import source. Civitas does **not** depend on GitHub at runtime to serve country/state/city lists. The dataset is licensed under ODbL; deployments using the imported data must keep attribution to dr5hn and the Open Database License.

### New installs and preview environments

For a fresh backend database, run the bootstrap command after `DATABASE_URL` is configured:

```bash
cd backend
npm run db:bootstrap
```

`db:bootstrap` runs SQL migrations first and then `locations:ensure`. The ensure step checks that the four location tables exist, counts active countries/states/cities, inspects the latest completed `location_import_runs` row, and skips the heavy import when the catalog is already ready. This makes the command idempotent for local development, review apps, and preview deploys.

### Manual import and controlled mirrors

Use `npm run locations:import` only when you intentionally want to refresh the full upstream catalog. The importer reads `countries.json` and `states.json` from the repository JSON directory and `json-cities.json.gz` from the latest GitHub release asset (the upstream project no longer publishes `json/cities.json` in the repository tree). It records each run in `location_import_runs`, upserts rows by upstream `source_id`, preserves local foreign keys, and marks rows inactive when they disappear from the imported source version. Override `LOCATION_COUNTRIES_JSON_URL`, `LOCATION_STATES_JSON_URL`, or `LOCATION_CITIES_JSON_URL` only for controlled mirrors.

### Coolify and production

Recommended Coolify flow: keep `npm start` as the backend start command and add a post-deploy command that runs `cd backend && npm run db:bootstrap` once per deploy/environment. In production, prefer an explicit release/job step for `npm run db:bootstrap` so only one process downloads and imports the ~250 countries, ~5,308 states, and ~152,967 cities.

The backend API and worker run the idempotent `locations:ensure` check after startup migrations. The ensure step skips when active countries already have `phone_code` values, and re-imports only when the catalog is empty/incomplete or active countries are missing dialing codes.

### Verification

Verify with the health endpoint after bootstrap:

```bash
curl http://localhost:3000/locations/health
curl http://localhost:3000/locations/countries
curl "http://localhost:3000/locations/states?countryId=1"
curl "http://localhost:3000/locations/cities?countryId=1&stateId=1"
curl "http://localhost:3000/locations/search?q=bog"
```

Verify with SQL when debugging:

```sql
select count(*) from location_countries;
select count(*) from location_states;
select count(*) from location_cities;
select * from location_import_runs order by started_at desc limit 1;
```

`locations:import` remains the manual full refresh command, while startup uses the safer `locations:ensure` gate to skip complete catalogs and backfill missing country `phone_code` values. When deployed behind the public `/api` prefix, the frontend consumes the same routes as `/api/locations/...` through `VITE_API_URL` / `APP_ENV.api.url` rather than duplicating `/api` inside Express.
