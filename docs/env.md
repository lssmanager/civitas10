# Civitas environment contract

## ENV CHAOS MAP

The repository previously allowed multiple names for the same concern:

- Frontend API resource duplicated `VITE_API_URL` with `VITE_API_RESOURCE`.
- Backend Logto tenant endpoint, M2M app ID, and M2M secret used generic names that were easy to confuse with the public SPA app.
- Public API routing (`/api`) and Coolify internal service routing (`/backend`) were documented in adjacent places without a hard rule.
- Platform helper names such as `SERVICE_URL_*`, `SERVICE_FQDN_*`, and `API_BASE_URL` are explicitly outside the Civitas runtime contract.

Final rule: Coolify owns routing only; env owns application logic only.

## Frontend env

```dotenv
VITE_API_URL=https://civitas.didaxus.com/api
VITE_LOGTO_ENDPOINT=https://auth.didaxus.com
VITE_LOGTO_APP_ID=replace-with-logto-spa-app-id
VITE_APP_REDIRECT_URI=https://civitas.didaxus.com/callback
VITE_APP_SIGNOUT_REDIRECT_URI=https://civitas.didaxus.com
```

## Backend env

```dotenv
API_URL=https://civitas.didaxus.com/api
DATABASE_URL=postgresql://civitas:change-me@postgres:5432/civitas
REDIS_URL=redis://redis:6379/0
LOGTO_API_RESOURCE_INDICATOR=https://civitas.didaxus.com/api
LOGTO_MANAGEMENT_API_RESOURCE=https://auth.didaxus.com/
LOGTO_MANAGEMENT_API_APPLICATION_ID=replace-with-logto-m2m-application-id
LOGTO_MANAGEMENT_API_APPLICATION_SECRET=replace-with-logto-m2m-application-secret
```

## Worker env

```dotenv
WORKER_CONCURRENCY=1
BULLMQ_PREFIX=civitas
```

The worker also consumes shared server-side infrastructure variables such as `DATABASE_URL` and `REDIS_URL`; it must not define API URL aliases.

## Coolify routing contract

Coolify domains are infrastructure routing only and must not be mirrored into app env variables:

| Coolify route | Service | Env exposure |
| --- | --- | --- |
| `/` | frontend | none |
| `/backend` | backend internal route | never exposed to frontend |
| `/worker` | worker internal route | never exposed to frontend |

The public API is always `https://civitas.didaxus.com/api`. If `/backend` and `/api` conflict in code or docs, `/api` wins.

## Logto resource separation

| Concern | Variable | Value |
| --- | --- | --- |
| Public Civitas API Resource / RBAC audience | `LOGTO_API_RESOURCE_INDICATOR` and frontend-derived `logtoResource` | `https://civitas.didaxus.com/api` |
| Logto tenant endpoint for SPA | `VITE_LOGTO_ENDPOINT` | `https://auth.didaxus.com` |
| Logto Management / M2M resource | `LOGTO_MANAGEMENT_API_RESOURCE` | `https://auth.didaxus.com/` |
| Backend M2M credentials | `LOGTO_MANAGEMENT_API_APPLICATION_ID`, `LOGTO_MANAGEMENT_API_APPLICATION_SECRET` | backend-only secrets |

Do not use the SPA app ID as the backend M2M application ID. Do not use the public Civitas API resource as the Logto Management API resource.

## Validation

Run:

```bash
node scripts/validate-env-config.mjs
```

The check fails when runtime files reintroduce banned aliases, duplicate API resource env names, `SERVICE_FQDN_*`, `SERVICE_URL_*`, `API_BASE_URL`, or a frontend `/backend` URL.
