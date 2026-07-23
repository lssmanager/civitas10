#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required for modules:p3-005:postgres-check. Provide an isolated PostgreSQL test database; this gate never falls back to SQLite, pg-mem, mocks, or in-memory Maps.');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', 'backend/integration/module-control-plane-postgres.integration.test.js'], {
  stdio: 'inherit',
  env: { ...process.env, P3_005_POSTGRES_CHECK: '1' },
});
process.exit(result.status ?? 1);
