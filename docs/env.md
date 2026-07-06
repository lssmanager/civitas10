# Civitas environment contract

## ENV CHAOS MAP

Civitas separates infrastructure metadata, Civitas runtime env, and auth identity:

- Coolify owns routing/domains and may inject service metadata variables for its own resource model.
- Env files contain minimal per-service Civitas runtime config only.
- Logto identity values are typed in `core/auth/civitas-auth.contract.ts` and compiled to `dist/auth.contract.json`.
- Runtime env values that mirror the contract must match it exactly and are rejected by validation if they drift.
- Preview deployments must not inherit production env; preview env must be explicit or empty.

## Compiled auth contract

```ts
CivitasSharedContract.logto.apiResource === "https://civitas.didaxus.com/api"
CivitasSharedContract.logto.issuer === "https://auth.didaxus.com"
CivitasSharedContract.logto.managementApi === "https://auth.didaxus.com"
CivitasSharedContract.api.publicUrl === "https://civitas.didaxus.com/api"
```

Build it with:

```bash
node scripts/build-auth-contract.mjs
```


## Deployment Kernel

`core/shared/civitas-shared.contract.cjs` is the source of shared semantics. `core/deployment/deployment-kernel.cjs` is the single parser/validator/normalizer for deploy config. It owns:

- exact allowed variables per service
- exact classification of Civitas contract variables, platform-generated metadata, and forbidden Civitas drift
- outside-contract rejection for Civitas-side variables
- explicit ignore semantics for platform metadata such as `SERVICE_*` and `COOLIFY_*`
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
```

Frontend accepts only the three variables shown above.

Frontend redirect and signout return URLs are derived at runtime from the current browser origin. Do not configure redirect URI env vars.

## Backend env

```dotenv
NODE_ENV=production
API_URL=https://civitas.didaxus.com/api
DATABASE_URL=postgresql://civitas:change-me@postgres:5432/civitas
REDIS_URL=redis://redis:6379/0
LOGTO_API_RESOURCE=https://civitas.didaxus.com/api
LOGTO_MANAGEMENT_API_RESOURCE=https://auth.didaxus.com/api
LOGTO_M2M_CLIENT_ID=replace-with-logto-m2m-client-id
LOGTO_M2M_CLIENT_SECRET=replace-with-logto-m2m-client-secret
BULLMQ_PREFIX=civitas
RUN_MIGRATIONS_ON_STARTUP=false
DATABASE_WAIT_TIMEOUT_MS=60000
DATABASE_WAIT_INTERVAL_MS=2000
DATABASE_CONNECT_TIMEOUT_MS=5000
```

Backend accepts only the variables shown above; configure `LOGTO_API_RESOURCE=https://civitas.didaxus.com/api` for Civitas API access and `LOGTO_MANAGEMENT_API_RESOURCE` as the separate Logto Management API resource indicator for M2M token requests. Do not use `LOGTO_ENDPOINT` or `VITE_LOGTO_ENDPOINT` as the Management API `resource`. URN-shaped or alternate Civitas API resource values are rejected.

## Worker env

```dotenv
NODE_ENV=production
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
WORKER_JOB_ATTEMPTS=3
WORKER_JOB_BACKOFF_MS=5000
WORKER_REMOVE_ON_COMPLETE=1000
WORKER_REMOVE_ON_FAIL=5000
```

Worker accepts only the variables shown above.

## Zero-drift deployment mode

The deployment kernel separates every runtime variable into four final-mode categories:

1. **Contract variables** are the exact per-service variables listed in the Frontend, Backend, and Worker sections above. Missing required values, malformed booleans/integers/URLs, and shared-contract mismatches fail startup. `LOGTO_API_RESOURCE` must be the canonical URL resource indicator and `LOGTO_MANAGEMENT_API_RESOURCE` must be explicitly defined for Logto M2M; URN-shaped or alternate values fail validation.
2. **Platform metadata** is infrastructure data injected by Coolify or another platform, currently `SERVICE_*` and `COOLIFY_*`. Civitas ignores these variables explicitly and reports them in `ignoredPlatformMetadata`; they are not application config and must not be added to compose, examples, or service code.
3. **Forbidden Civitas drift** is removed Civitas configuration from older models. These names still fail hard because accepting them would hide stale auth, redirect, or domain configuration.
4. **Cross-service pollution** is a valid Civitas variable injected into the wrong service. Examples: `ENABLE_QUEUE_RECONCILER` in API/backend, or `LOGTO_API_RESOURCE` in worker. Runtime reports these names in `ignoredCrossServicePollution` and does not consume them, so Coolify shared-env noise cannot crash startup. Strict validation/preflight still fails on these names so the operator can fix Coolify without Civitas silently accepting them as contract.

Forbidden Civitas drift includes:

- `LOGTO_CLIENT_ID`
- `LOGTO_CLIENT_SECRET`
- `LOGTO_ENDPOINT`
- `LOGTO_MANAGEMENT_API_TOKEN_ENDPOINT`
- `LOGTO_MANAGEMENT_API_APPLICATION_ID`
- `LOGTO_MANAGEMENT_API_APPLICATION_SECRET`
- `VITE_APP_REDIRECT_URI`
- `VITE_APP_SIGNOUT_REDIRECT_URI`
- `VITE_API_RESOURCE_INDICATOR`
- `VITE_API_BASE_URL`
- `VITE_API_RESOURCE`
- `VITE_LOGTO_API_RESOURCE`
- references to the removed `socialstudies.cloud` domain

The final rule is: service contracts are strict, Coolify metadata is ignored as non-contract infrastructure, old Civitas drift is rejected, valid Civitas variables from another service are reported and ignored at runtime while strict validation/preflight rejects them, Unknown non-Civitas variables are not promoted to contract and are not consumed by Civitas.

## Coolify final-mode checklist

- **Frontend env**: configure only `VITE_API_URL`, `VITE_LOGTO_ENDPOINT`, and `VITE_LOGTO_APP_ID`. Do not configure redirect/signout variables; the frontend derives them from `window.location.origin`.
- **API env**: configure only `NODE_ENV`, `API_URL`, `DATABASE_URL`, `REDIS_URL`, `LOGTO_API_RESOURCE`, `LOGTO_MANAGEMENT_API_RESOURCE`, `LOGTO_M2M_CLIENT_ID`, `LOGTO_M2M_CLIENT_SECRET`, `BULLMQ_PREFIX`, `RUN_MIGRATIONS_ON_STARTUP`, `DATABASE_WAIT_TIMEOUT_MS`, `DATABASE_WAIT_INTERVAL_MS`, and `DATABASE_CONNECT_TIMEOUT_MS`.
- **Worker env**: configure only `NODE_ENV`, `DATABASE_URL`, `REDIS_URL`, `BULLMQ_PREFIX`, `WORKER_CONCURRENCY`, `ENABLE_QUEUE_RECONCILER`, `ENABLE_DB_POLL_EXECUTION`, `RUN_MIGRATIONS_ON_STARTUP`, `DATABASE_WAIT_TIMEOUT_MS`, `DATABASE_WAIT_INTERVAL_MS`, and `DATABASE_CONNECT_TIMEOUT_MS`.
- **Platform metadata**: `SERVICE_*` and `COOLIFY_*` may appear because Coolify generated them. Do not chase them in the repo, do not copy them into env examples, and do not wire them into code.
- **Cross-service variables to correct in Coolify**: if API shows worker variables such as `WORKER_CONCURRENCY`, `ENABLE_QUEUE_RECONCILER`, or `ENABLE_DB_POLL_EXECUTION`, runtime will ignore them but they should still be removed from API. If worker shows API variables such as `API_URL`, `LOGTO_API_RESOURCE`, `LOGTO_MANAGEMENT_API_RESOURCE`, `LOGTO_M2M_CLIENT_ID`, or `LOGTO_M2M_CLIENT_SECRET`, runtime will ignore them but they should still be removed from worker.

## Preview deployments

For Coolify previews:

1. Disable automatic env inheritance from production.
2. Keep only the final service-specific variables listed in this document.
3. Leave preview env empty unless a preview-specific value is explicitly required.
4. Never copy production M2M credentials into preview services.
5. Do not delete platform metadata just to satisfy Civitas; `SERVICE_*` and `COOLIFY_*` metadata may exist, but Civitas must not consume it.

## Coolify routing contract

| Coolify route | Service | Env/auth source |
| --- | --- | --- |
| `/` | frontend | frontend env + compiled contract validation |
| `/backend` | backend internal route | backend env + compiled contract validation |
| `/worker` | worker internal route | worker env only |

The public API transport URL remains `https://civitas.didaxus.com/api`. If `/backend` and `/api` conflict in code or docs, `/api` wins for HTTP transport; auth audience remains `https://civitas.didaxus.com/api`.

## Validation

Run:

```bash
node scripts/build-auth-contract.mjs
node scripts/validate-auth-contract.mjs
node scripts/validate-env-config.mjs
```

The checks fail when runtime files introduce Civitas variables outside the final service contracts, forbidden old Civitas aliases, platform metadata consumption by app code, URL-shaped Logto resources in strict preflight, frontend/backend/worker layer mixing, or API URL to audience derivation. Platform-generated metadata may be present in the runtime environment without being accepted as Civitas configuration.
