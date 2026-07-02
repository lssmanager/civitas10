# Civitas 1.1

Civitas 1.1 is the clean reconstruction foundation for the Civitas platform. It keeps the parts that already work well from the previous codebase and removes the contaminated owner UI and legacy operational surfaces that were mixing logs, snapshots, and partial truths.

This repository is no longer treated as the original Logto sample app. It now serves as the clean base for:

- Logto as the canonical identity, organizations, memberships, roles, permissions, tenant context, and token source
- a standardized operational backbone for Civitas
- an extensible RBAC contract for `owner_global`, `organization_admin`, and `organization_member`
- future capability-based modules such as CRM, Marketing, LMS, Community, and Payments

## Fuente canónica por dominio

- **Logto**: identity, authentication, organizations, memberships, roles, permissions, tenant context, and tokens
- **FluentCRM / WordPress**: commercial relationship, company, contacts, tags, lists, purchase, renewal, and commercial status
- **Moodle**: courses, enrollments, progress, and academic history
- **BuddyBoss**: groups, community, and social memberships
- **Civitas database**: operational metadata, audit data, synchronization state, mappings between systems, queues, events, reconciliation state, and cross-system operational rules

### What must not live canonically in PostgreSQL

- parallel organizations if Logto already defines the real organization
- parallel RBAC models if Logto already defines the real permissions and roles
- provider live state presented as if it were local truth without clear source labeling
- UI-specific summaries as if they were canonical business state

## What has already been migrated into this repository

### Identity and access foundation

- backend Logto authentication middleware
- backend Logto Management API integration
- owner-global organization provisioning endpoint
- organization creation in Logto from Civitas
- organization admin bootstrap in Logto from Civitas
- user and organization `customData` handling foundations
- frontend environment wiring for Logto and API connectivity

### Operational backbone foundation

- standardized operational action catalog
- standardized operational contract builders
- consolidated operational response JSON schema
- frontend operational contract types
- backend operational contract tests
- canonical operational JSON examples

### RBAC foundation

- frontend RBAC matrix separated for:
  - `owner_global`
  - `organization_admin`
  - `organization_member`

## What is intentionally not migrated yet

The following parts are intentionally not treated as the current baseline because they need a cleaner rebuild:

- owner dashboard UI
- organization operational console UI
- worker and queues UI
- logs UI as a primary support path
- any legacy surface that recomposes truth from partial snapshots or pushes users into circular navigation

## Repository structure

- `backend/`: Node.js API and Logto integration foundation
- `frontend/`: React frontend foundation and RBAC-aware route metadata
- `contracts/`: operational schemas
- `examples/`: canonical operational contract examples
- `docs/architecture/`: architectural backbone documentation
- `docker-compose.yml`: minimal two-service startup for backend and frontend

## Quick container start

If your deployment platform expects Docker Compose, this repository now exposes a root `docker-compose.yml`.

1. Copy the root environment file.

```bash
cp .env.example .env
```

2. Copy the backend environment file.

```bash
cp backend/.env.example backend/.env
```

3. Fill both files with your real Logto values.

4. Start the stack.

```bash
docker compose up --build
```

Services exposed by default:

- frontend: `http://localhost:4173`
- backend: `http://localhost:3000`

## Local setup

### Prerequisites

- Node.js 22+ recommended
- a Logto tenant
- one Logto SPA application for the frontend
- one Logto M2M application for backend management API access

## Environment convention

Civitas10 now uses one canonical environment variable per service concept. Frontend values are build-time Vite variables and must use the `VITE_*` prefix. Backend and worker values must not depend on `VITE_*` variables. PostgreSQL and Redis are configured only through connection URLs.

### Frontend (Vite)

```env
VITE_API_URL=https://civitas.socialstudies.cloud/api
VITE_LOGTO_ENDPOINT=https://auth.learnsocialstudies.com
VITE_LOGTO_APP_ID=avc4zf5kjm5rgc5xgsegh
VITE_APP_REDIRECT_URI=https://civitas.socialstudies.cloud/callback
VITE_APP_SIGNOUT_REDIRECT_URI=https://civitas.socialstudies.cloud
```

### Backend/API

```env
NODE_ENV=production
API_URL=https://civitas.socialstudies.cloud/api
LOGTO_ENDPOINT=https://auth.learnsocialstudies.com
LOGTO_CLIENT_ID=
LOGTO_CLIENT_SECRET=
DATABASE_URL=
REDIS_URL=
BULLMQ_PREFIX=civitas
WORKER_CONCURRENCY=1
ENABLE_QUEUE_RECONCILER=true
RUN_MIGRATIONS_ON_STARTUP=false
DATABASE_WAIT_TIMEOUT_MS=30000
DATABASE_WAIT_INTERVAL_MS=1000
DATABASE_CONNECT_TIMEOUT_MS=5000
ENABLE_DB_POLL_EXECUTION=false
```

### Worker

The worker reuses the backend variables that apply to queue and database execution:

```env
NODE_ENV=production
API_URL=https://civitas.socialstudies.cloud/api
LOGTO_ENDPOINT=https://auth.learnsocialstudies.com
LOGTO_CLIENT_ID=
LOGTO_CLIENT_SECRET=
DATABASE_URL=
REDIS_URL=
BULLMQ_PREFIX=civitas
WORKER_CONCURRENCY=1
ENABLE_QUEUE_RECONCILER=true
ENABLE_DB_POLL_EXECUTION=false
```

### Additional backend-only Logto Management API variables

These variables are still required for owner organization provisioning and Logto Management API calls. They are backend-only and are not exposed to the frontend.

```env
LOGTO_MANAGEMENT_API_TOKEN_ENDPOINT=
LOGTO_MANAGEMENT_API_APPLICATION_ID=
LOGTO_MANAGEMENT_API_APPLICATION_SECRET=
LOGTO_MANAGEMENT_API_RESOURCE=
```

## Backend setup

1. Go to the backend directory.

```bash
cd backend
```

2. Copy the environment file.

```bash
cp .env.example .env
```

3. Configure `DATABASE_URL`, `REDIS_URL`, `API_URL`, and the backend-only Logto values in `backend/.env`. Do not configure PostgreSQL from fragmented user/password/database variables. Do not configure Redis from anything except `REDIS_URL`.

4. Install dependencies.

```bash
npm install
```

5. Run the backend.

```bash
npm run dev
```

### Backend health checks

Once running, validate:

- `GET /health` should return `ok: true`
- `GET /` should return the backend identity payload
- `GET /me` should work with a valid bearer token

### Current backend owner flow

The clean migrated owner-global route currently available is:

- `POST /owner/organizations`

This route is designed for a global owner token and should:

- create the Logto organization
- ensure the organization template exists
- add the bootstrap admin user to the organization
- assign the organization admin role when resolved

## Frontend setup

1. Go to the frontend directory.

```bash
cd frontend
```

2. Copy the frontend environment file.

```bash
cp .env.example .env
```

3. Configure only Vite-prefixed frontend variables: `VITE_API_URL`, `VITE_LOGTO_ENDPOINT`, `VITE_LOGTO_APP_ID`, `VITE_APP_REDIRECT_URI`, and `VITE_APP_SIGNOUT_REDIRECT_URI`.

4. Install dependencies.

```bash
npm install
```

5. Run the frontend.

```bash
npm run dev
```

## How to connect frontend and backend correctly

- `VITE_API_URL` is the frontend API base URL and the Logto API resource/audience requested by the SPA.
- `API_URL` is the backend API URL and the Logto API resource/audience validated by API middleware.
- owner-global routes must be protected by global roles, not by implicit organization membership.
- organization-scoped routes must remain separate from global-owner routes.

## Current validation targets

At this stage, validate these first:

1. frontend login through Logto
2. backend token verification through Logto JWKS
3. `GET /me` payload shape
4. owner-global organization creation through `POST /owner/organizations`
5. operational contract tests with `npm test` in `backend`
6. compose startup with `docker compose up --build`

## Architecture notes

This repository is intended to evolve as a capability-based Civitas platform:

- identity
- CRM
- Marketing
- LMS
- Community
- Payments
- worker action engine
- operational-state
- worker-queues

Each capability should be introduced through:

- a stable contract
- adapters per provider
- operational observability
- standardized actions
- explicit canonical source boundaries

## Next migration layer

The next layer to migrate after this clean foundation is:

1. operational state assembler and observability services after cleanup
2. connector registry
3. CRM capability contract from the FluentCRM foundations
4. worker action engine
5. clean owner-facing UI surfaces rebuilt on top of the backbone

## Infraestructura requerida

Civitas requiere servicios externos:

- PostgreSQL 16+
- Redis 7+
- Logto tenant
- Logto SPA application
- Logto M2M application
- Coolify environment variables

En staging/producción, PostgreSQL y Redis se configuran por URL.
No se ejecutan como servicios internos del compose principal.
Para desarrollo local puede usarse:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```

Variables obligatorias de runtime:

- `DATABASE_URL`
- `REDIS_URL`
- `CONNECTOR_ENCRYPT_KEY`

Generar `CONNECTOR_ENCRYPT_KEY` con:

```bash
openssl rand -hex 32
```

Canonical middleware order:

```txt
requireAuth → requireOrg → requirePermission(permission) → requireSeats → handler
```

Logto incompleto en `/health` se reporta como `degraded` o `unhealthy` en `services.logto`; PostgreSQL o Redis unhealthy retornan HTTP 503.
