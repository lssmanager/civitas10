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
LOGTO_ENDPOINT=https://auth.didaxus.com
LOGTO_CLIENT_ID=h4xwfa8s6cuj5blhzplga
LOGTO_CLIENT_SECRET=
DATABASE_URL=
REDIS_URL=
# Optional: queue/worker tuning
# BULLMQ_PREFIX=civitas
# WORKER_CONCURRENCY=1
# ENABLE_QUEUE_RECONCILER=true
# ENABLE_DB_POLL_EXECUTION=false

# Optional: legacy connector-specific Logto Management API override
# LOGTO_MANAGEMENT_API_TOKEN_ENDPOINT=
# LOGTO_MANAGEMENT_API_APPLICATION_ID=
# LOGTO_MANAGEMENT_API_APPLICATION_SECRET=
# LOGTO_MANAGEMENT_API_RESOURCE=
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
- `LOGTO_ENDPOINT` must be the base tenant domain. Civitas derives `/oidc`, `/oidc/jwks`, `/oidc/token`, and the Management API resource from that base.
- `LOGTO_CLIENT_ID` and `LOGTO_CLIENT_SECRET` must be the backend M2M credentials used for owner provisioning and other Logto Management API calls.
- Backend and worker do not consume `VITE_*` variables.
- Queue tuning variables are optional; code defaults are used when they are omitted.
- Legacy connector-specific `LOGTO_MANAGEMENT_API_*` variables are optional overrides. The main owner provisioning flow derives Management API token details from `LOGTO_ENDPOINT` and uses `LOGTO_CLIENT_ID`/`LOGTO_CLIENT_SECRET`.
