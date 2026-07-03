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
LOGTO_CLIENT_ID=replace-with-logto-m2m-client-id
LOGTO_CLIENT_SECRET=replace-with-logto-m2m-client-secret
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
- `LOGTO_ENDPOINT` must be the base tenant domain. Civitas derives OIDC, JWKS, token, and Management API resource URLs from that base.
- `LOGTO_CLIENT_ID` and `LOGTO_CLIENT_SECRET` must be backend M2M credentials, not the frontend SPA application ID.
- Backend and worker do not consume `VITE_*` variables.
