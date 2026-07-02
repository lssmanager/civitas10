# Civitas10 environment variables

The project uses a single source of truth for each service configuration value.

## Frontend only

The frontend is a Vite app and only reads `VITE_*` variables:

```env
VITE_API_URL=https://civitas.socialstudies.cloud/api
VITE_LOGTO_ENDPOINT=https://auth.learnsocialstudies.com
VITE_LOGTO_APP_ID=avc4zf5kjm5rgc5xgsegh
VITE_APP_REDIRECT_URI=https://civitas.socialstudies.cloud/callback
VITE_APP_SIGNOUT_REDIRECT_URI=https://civitas.socialstudies.cloud
```

## Backend/API

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

## Worker

The worker uses the same backend values when they apply:

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

## Additional backend-only variables

Logto Management API calls for owner organization provisioning still require these backend-only values:

```env
LOGTO_MANAGEMENT_API_TOKEN_ENDPOINT=
LOGTO_MANAGEMENT_API_APPLICATION_ID=
LOGTO_MANAGEMENT_API_APPLICATION_SECRET=
LOGTO_MANAGEMENT_API_RESOURCE=
```

## Removed names

Do not use legacy service URL/FQDN aliases, legacy Vite API aliases, legacy Logto audience aliases, or fragmented PostgreSQL variables. PostgreSQL must be represented by `DATABASE_URL`; Redis must be represented by `REDIS_URL`.
