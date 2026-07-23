#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
const r=spawnSync(process.execPath,['--test','backend/test/integration-events-contract.test.js'],{stdio:'inherit'});
process.exit(r.status ?? 1);
