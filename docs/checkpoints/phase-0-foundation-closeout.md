# Phase 0 Foundation Closeout

## Required evidence

### Package locks
- backend/package-lock.json refreshed
- frontend/package-lock.json refreshed

### Runtime
- DATABASE_URL required
- REDIS_URL required
- CONNECTOR_ENCRYPT_KEY required for connector secrets
- PostgreSQL external in staging
- Redis external in staging

### Health
Command:

```bash
curl https://civitas.socialstudies.cloud/health
```

Expected:

```txt
services.database = ok
services.redis = ok
```

### Worker
Command:

```bash
docker compose logs worker
```

Expected:

```txt
Worker listening on priority_commands
Worker listening on background_events
```

### BullMQ smoke
Command:

```bash
cd backend
npm run smoke:bullmq
```

Expected:

```txt
system.echo completed
```

### Gate decision
Fase 1 can start only after all items above are checked.

## Final gate

- [ ] `npm install` executed in backend
- [ ] `npm install` executed in frontend
- [ ] backend tests pass
- [ ] frontend build passes
- [ ] backend health returns database ok
- [ ] worker health returns bullmq transport
- [ ] smoke:bullmq passes with real Redis
- [ ] Coolify has DATABASE_URL
- [ ] Coolify has REDIS_URL
- [ ] Coolify has LOGTO variables
- [ ] Coolify has CONNECTOR_ENCRYPT_KEY
