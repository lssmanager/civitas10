# Civitas10 environment variables

The project uses a single source of truth for each service configuration value. Frontend values are Vite build-time variables only. Backend and worker runtime values never use `VITE_*`. PostgreSQL and Redis are represented only by `DATABASE_URL` and `REDIS_URL`.

## Frontend only

```env
VITE_API_URL=https://civitas.didaxus.com/api
VITE_LOGTO_ENDPOINT=https://auth.didaxus.com
VITE_LOGTO_APP_ID=h4xwfa8s6cuj5blhzplga
VITE_APP_REDIRECT_URI=https://civitas.didaxus.com/callback
VITE_APP_SIGNOUT_REDIRECT_URI=https://civitas.didaxus.com
```

## Backend/API

```env
NODE_ENV=production
API_URL=https://civitas.didaxus.com/api
LOGTO_ENDPOINT=https://auth.didaxus.com
LOGTO_CLIENT_ID=h4xwfa8s6cuj5blhzplga
LOGTO_CLIENT_SECRET=
DATABASE_URL=
REDIS_URL=
```

Optional queue/worker tuning, only when defaults need to be overridden:

```env
BULLMQ_PREFIX=civitas
WORKER_CONCURRENCY=1
ENABLE_QUEUE_RECONCILER=true
ENABLE_DB_POLL_EXECUTION=false
```

## Worker

The worker reuses the backend project and the same runtime contract:

```env
NODE_ENV=production
API_URL=https://civitas.didaxus.com/api
LOGTO_ENDPOINT=https://auth.didaxus.com
LOGTO_CLIENT_ID=h4xwfa8s6cuj5blhzplga
LOGTO_CLIENT_SECRET=
DATABASE_URL=
REDIS_URL=
```

Optional worker values are the same queue/worker tuning variables listed above.

## Optional legacy connector-specific Logto overrides

The main Logto Management API integration derives its token endpoint and resource from `LOGTO_ENDPOINT` and uses `LOGTO_CLIENT_ID`/`LOGTO_CLIENT_SECRET`. These values are only for connector-specific overrides that still read them directly:

```env
LOGTO_MANAGEMENT_API_TOKEN_ENDPOINT=
LOGTO_MANAGEMENT_API_APPLICATION_ID=
LOGTO_MANAGEMENT_API_APPLICATION_SECRET=
LOGTO_MANAGEMENT_API_RESOURCE=
```

## Removed names

Do not use legacy service URL/FQDN aliases, legacy Vite API aliases, legacy Logto audience aliases, fragmented PostgreSQL variables (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`), or fragmented Redis variables (`REDIS_HOST`, `REDIS_PORT`). PostgreSQL must be represented by `DATABASE_URL`; Redis must be represented by `REDIS_URL`.
