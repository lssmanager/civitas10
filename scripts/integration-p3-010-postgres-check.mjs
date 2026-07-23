#!/usr/bin/env node
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL is required for integration:p3-010:postgres-check'); process.exit(1); }
process.env.P3_010_POSTGRES_CHECK='1';
import { spawnSync } from 'node:child_process';
const r=spawnSync(process.execPath,['--test','backend/integration/integration-events-postgres.integration.test.js'],{stdio:'inherit',env:process.env});
process.exit(r.status ?? 1);
