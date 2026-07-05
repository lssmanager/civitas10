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
CivitasSharedContract.logto.apiResource === "urn:civitas:api"
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
- explicit ignore semantics for platform metadata such as `SERVICE_FQDN_*`, `SERVICE_URL_*`, `SERVICE_API_*`, and `COOLIFY_*`
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
LOGTO_API_RESOURCE=urn:civitas:api
LOGTO_M2M_CLIENT_ID=replace-with-logto-m2m-client-id
LOGTO_M2M_CLIENT_SECRET=replace-with-logto-m2m-client-secret
BULLMQ_PREFIX=civitas
RUN_MIGRATIONS_ON_STARTUP=false
DATABASE_WAIT_TIMEOUT_MS=60000
DATABASE_WAIT_INTERVAL_MS=2000
DATABASE_CONNECT_TIMEOUT_MS=5000
```

Backend accepts only the variables shown above; `LOGTO_API_RESOURCE` must not be URL-shaped.

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
```

Worker accepts only the variables shown above.

## Zero-drift deployment mode

The deployment kernel separates every runtime variable into three categories:

1. **Contract variables** are the per-service variables listed above. These define Civitas runtime behavior and remain strictly allowlisted.
2. **Platform-generated metadata** is infrastructure data injected by the deployment platform, including `SERVICE_FQDN_*`, `SERVICE_URL_*`, `SERVICE_API_*`, and `COOLIFY_*`. Coolify can inject these variables for its own service metadata. Civitas does not use them, does not document them as app configuration, and does not wire them into Docker build arguments, examples, or service logic. Their presence alone does not invalidate runtime validation.
3. **Forbidden Civitas-side aliases or drift variables** are removed Civitas configuration names. They still fail hard if present because they can mix old configuration models with the current contract.

Forbidden Civitas drift includes:

- `LOGTO_CLIENT_ID`
- `LOGTO_CLIENT_SECRET`
- `LOGTO_ENDPOINT`
- `LOGTO_MANAGEMENT_API_RESOURCE`
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

The rule is: Civitas contract variables are strict, platform metadata is ignored as non-contract infrastructure, and old Civitas aliases are errors.

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

The public API transport URL remains `https://civitas.didaxus.com/api`. If `/backend` and `/api` conflict in code or docs, `/api` wins for HTTP transport; auth audience remains `urn:civitas:api`.

## Validation

Run:

```bash
node scripts/build-auth-contract.mjs
node scripts/validate-auth-contract.mjs
node scripts/validate-env-config.mjs
```

The checks fail when runtime files introduce Civitas variables outside the final service contracts, forbidden old Civitas aliases, platform metadata consumption by app code, URL-shaped Logto resources, frontend/backend/worker layer mixing, or API URL to audience derivation. Platform-generated metadata may be present in the runtime environment without being accepted as Civitas configuration.
