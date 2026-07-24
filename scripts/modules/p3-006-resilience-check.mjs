#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
const result=spawnSync(process.execPath,['--test','backend/test/module-availability-resolver-contract.test.js'],{stdio:'inherit'});
process.exit(result.status??1);
