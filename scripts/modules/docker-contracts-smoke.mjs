#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const image = process.argv[2] || process.env.CIVITAS_BACKEND_IMAGE || 'civitas10-api';
const checks = [
  ['/contracts/modules/module-catalog.v2.json', 'module catalog'],
  ['/contracts/modules/generated/module-catalog-v2.inventory.sha256', 'module catalog inventory hash'],
  ['/contracts/integration/integration-event-registry.json', 'integration event registry'],
];

const script = String.raw`
const fs = require('node:fs');
for (const [file, label] of ${JSON.stringify(checks)}) {
  if (!fs.existsSync(file)) throw new Error(label + ' missing at ' + file);
  if (!fs.readFileSync(file, 'utf8').trim()) throw new Error(label + ' empty at ' + file);
}
JSON.parse(fs.readFileSync('/contracts/modules/module-catalog.v2.json', 'utf8'));
JSON.parse(fs.readFileSync('/contracts/integration/integration-event-registry.json', 'utf8'));
const integration = require('/app/services/integrationEvents');
integration.createEventSchemaRegistry();
require('/app/services/moduleControlPlane');
`;

function run(args, label) {
  const result = spawnSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.status !== 0) {
    console.error(JSON.stringify({ ok: false, label, status: result.status, stdout: result.stdout, stderr: result.stderr }, null, 2));
    process.exit(result.status || 1);
  }
  return result;
}

run(['run', '--rm', '--entrypoint', 'node', image, '-e', script], 'contracts and backend modules');
run(['run', '--rm', '--entrypoint', 'node', image, '/scripts/modules/p3-005-preflight.mjs'], 'read-only p3-005 preflight');
console.log(JSON.stringify({ ok: true, image, checks: checks.map(([file, label]) => ({ file, label })) }, null, 2));
