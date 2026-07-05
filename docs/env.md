# Civitas auth and environment contract

## ENV CHAOS MAP

Civitas authentication no longer treats env variables as the source of truth for identity values. The previous drift-prone model allowed frontend, backend, worker, and Logto values to be repeated as env variables. The final model is:

- Auth identity lives in `core/auth/civitas-auth.contract.ts`.
- Runtime services load the compiled `dist/auth.contract.json`.
- Env files contain deployment metadata and secrets only.
- Coolify owns routing only.

## Compiled auth contract

```ts
CivitasAuthContract.logto.apiResource === "urn:civitas:api"
CivitasAuthContract.logto.issuer === "https://auth.didaxus.com"
CivitasAuthContract.logto.managementApi === "https://auth.didaxus.com"
CivitasAuthContract.api.publicUrl === "https://civitas.didaxus.com/api"
```

Build it with:

```bash
node scripts/build-auth-contract.mjs
```

This writes `dist/auth.contract.json`, which backend and worker load at runtime.

## Frontend env

```dotenv
VITE_LOGTO_APP_ID=replace-with-logto-spa-app-id
VITE_APP_REDIRECT_URI=https://civitas.didaxus.com/callback
VITE_APP_SIGNOUT_REDIRECT_URI=https://civitas.didaxus.com
```

The SPA reads issuer, API resource, and API URL from the compiled auth contract via frontend config. It must not define `VITE_LOGTO_API_RESOURCE`, `VITE_LOGTO_ENDPOINT`, or `VITE_API_URL`.

## Backend env

```dotenv
DATABASE_URL=postgresql://civitas:change-me@postgres:5432/civitas
REDIS_URL=redis://redis:6379/0
LOGTO_MANAGEMENT_API_APPLICATION_ID=replace-with-logto-m2m-application-id
LOGTO_MANAGEMENT_API_APPLICATION_SECRET=replace-with-logto-m2m-application-secret
```

Backend JWT validation reads the expected audience from the compiled auth contract. It must not define `LOGTO_API_RESOURCE`, `LOGTO_ENDPOINT`, `LOGTO_MANAGEMENT_API_RESOURCE`, or derive auth from `API_URL`.

## Worker env

```dotenv
WORKER_CONCURRENCY=1
BULLMQ_PREFIX=civitas
```

The worker shares backend infrastructure variables such as `DATABASE_URL` and `REDIS_URL`, and loads the same compiled auth contract. It must not define or derive Logto audience values.

## Coolify routing contract

Coolify domains are infrastructure routing only and must not be mirrored into auth env variables:

| Coolify route | Service | Auth source |
| --- | --- | --- |
| `/` | frontend | compiled contract |
| `/backend` | backend internal route | compiled contract |
| `/worker` | worker internal route | compiled contract |

The public API transport URL remains `https://civitas.didaxus.com/api`. If `/backend` and `/api` conflict in code or docs, `/api` wins for HTTP transport only; auth identity still comes from `urn:civitas:api`.

## Validation

Run:

```bash
node scripts/build-auth-contract.mjs
node scripts/validate-auth-contract.mjs
node scripts/validate-env-config.mjs
```

The checks fail when runtime files reintroduce env-based auth resolution, URL-shaped Logto resources, duplicated audience definitions, banned aliases, or API URL to audience derivation.
