## Summary

## Testing

## Evidence

- [ ] Worker logs attached
- [ ] Health endpoint validated via curl (`curl http://localhost:3000/health` returns `status: healthy`, `db: connected`, `redis: connected`)
- [ ] Env validation executed (`node runtime/env.js`)
- [ ] Deployment verified in Coolify (runtime variables loaded, deployment logs have no env errors, containers are running)
