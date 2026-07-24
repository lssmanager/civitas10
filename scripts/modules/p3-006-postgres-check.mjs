#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL is required for modules:p3-006:postgres-check.'); process.exit(1); }
const result=spawnSync(process.execPath,['--test','backend/integration/module-availability-postgres.integration.test.js'],{stdio:'inherit',env:{...process.env,P3_006_POSTGRES_CHECK:'1'}});
process.exit(result.status??1);
