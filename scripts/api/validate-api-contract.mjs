import { spawnSync } from 'node:child_process';

const scripts = [
  'scripts/api/validate-api-style.mjs',
  'scripts/api/validate-openapi-contract.mjs',
  'scripts/api/validate-module-ownership.mjs',
  'scripts/api/validate-api-authz-contract.mjs',
];

for (const script of scripts) {
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('Civitas REST API contract validation passed.');
