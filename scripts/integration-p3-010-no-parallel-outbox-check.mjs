#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
const args = ['grep', '-nE', 'create table if not exists .*outbox|new Map\(\).*outbox|createInMemory.*Outbox|module_.*outbox|planning_.*outbox', '--', 'backend', 'scripts', ':(exclude)backend/db/migrations/0011_authorization_runtime_consistency.sql', ':(exclude)backend/db/migrations/0020_integration_events_operations.sql', ':(exclude)scripts/integration-p3-010-no-parallel-outbox-check.mjs'];
const result = spawnSync('git', args, { encoding: 'utf8' });
if (result.status !== 0 && result.status !== 1) {
  console.error(result.stderr || result.stdout || `git grep failed with status ${result.status}`);
  process.exit(result.status ?? 1);
}
const out = (result.stdout || '').trim().split('\n').filter(Boolean);
const allowed = out.filter((l) => /taxonomyRepository|unitRepository|dataScopeRepository|authorizationVersionService|authorizationOutboxDispatcher|moduleControlPlane|test|foundation primitive|compatibility primitive/.test(l));
const bad = out.filter((l) => !allowed.includes(l));
if (bad.length) { console.error('P3_010_PARALLEL_OUTBOX_FOUND'); console.error(bad.join('\n')); process.exit(1); }
console.log('No production parallel outbox foundation detected.');
