# Civitas environment contract

## ENV CHAOS MAP

Civitas separates infrastructure, runtime env, and auth identity:

- Coolify owns routing/domains only.
- Env files contain minimal per-service runtime config.
- Logto identity values are typed in `core/auth/civitas-auth.contract.ts` and compiled to `dist/auth.contract.json`.
- Runtime env values that mirror the contract must match it exactly and are rejected by validation if they drift.
- Preview deployments must not inherit production env; preview env must be explicit or empty.

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


## Deployment Kernel

`core/deployment/deployment-kernel.cjs` is the single parser/validator/normalizer for deploy config. It owns:

- allowed and forbidden variables per service
- legacy alias detection
- HTTP URL validation
- logical Logto resource validation
- SPA vs M2M separation
- contract mismatch errors
- normalized frontend/backend/worker config shapes

All service consumers must call `validateDeploymentConfig({ service, env })` directly or through a wrapper that delegates to it. Local validation is allowed only when it is subordinate to the kernel.

## Frontend env

```dotenv
VITE_API_URL=https://civitas.didaxus.com/api
VITE_LOGTO_ENDPOINT=https://auth.didaxus.com
VITE_LOGTO_APP_ID=replace-with-logto-spa-app-id
VITE_APP_REDIRECT_URI=https://civitas.didaxus.com/callback
VITE_APP_SIGNOUT_REDIRECT_URI=https://civitas.didaxus.com
```

Forbidden in frontend: `VITE_API_BASE_URL`, `VITE_API_RESOURCE`, `VITE_LOGTO_API_RESOURCE`, and all `SERVICE_*` variables.

## Backend env

```dotenv
API_URL=https://civitas.didaxus.com/api
DATABASE_URL=postgresql://civitas:change-me@postgres:5432/civitas
REDIS_URL=redis://redis:6379/0
LOGTO_API_RESOURCE=urn:civitas:api
LOGTO_M2M_CLIENT_ID=replace-with-logto-m2m-client-id
LOGTO_M2M_CLIENT_SECRET=replace-with-logto-m2m-client-secret
BULLMQ_PREFIX=civitas
```

Forbidden in backend: `SERVICE_URL_*`, `SERVICE_FQDN_*`, `SERVICE_API_*`, `API_BASE_URL`, `LOGTO_CLIENT_ID`, `LOGTO_CLIENT_SECRET`, `LOGTO_MANAGEMENT_API_RESOURCE`, and URL-shaped Logto API resources.

## Worker env

```dotenv
DATABASE_URL=postgresql://civitas:change-me@postgres:5432/civitas
REDIS_URL=redis://redis:6379/0
BULLMQ_PREFIX=civitas
WORKER_CONCURRENCY=1
```

Forbidden in worker: frontend variables, SPA Logto config, M2M credentials, `API_URL`, and `LOGTO_API_RESOURCE`.

## Preview deployments

For Coolify previews:

1. Disable automatic env inheritance from production.
2. Delete inherited `SERVICE_*`, `SERVICE_FQDN_*`, `SERVICE_API_*`, `API_BASE_URL`, and legacy Logto aliases.
3. Leave preview env empty unless a preview-specific value is explicitly required.
4. Never copy production M2M credentials into preview services.

## Coolify routing contract

| Coolify route | Service | Env/auth source |
| --- | --- | --- |
| `/` | frontend | frontend env + compiled contract validation |
| `/backend` | backend internal route | backend env + compiled contract validation |
| `/worker` | worker internal route | worker env only |

The public API transport URL remains `https://civitas.didaxus.com/api`. If `/backend` and `/api` conflict in code or docs, `/api` wins for HTTP transport; auth audience remains `urn:civitas:api`.

## Validation

Run:

```bash
node scripts/build-auth-contract.mjs
node scripts/validate-auth-contract.mjs
node scripts/validate-env-config.mjs
```

The checks fail when runtime files reintroduce legacy env aliases, preview contamination patterns, URL-shaped Logto resources, frontend/backend/worker layer mixing, or API URL to audience derivation.
