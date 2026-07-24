#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
const pattern = 'accessToken|access-token|access_token|refreshToken|bearerToken|clientSecret|client_secret|privateKey|private_key|api_key|api-key|Authorization:|authorization:|credential|cookie|password|bearer|(^|[^_])token|rawProviderResponse|secret';
const args = ['grep', '-nE', pattern, '--', 'contracts/integration', 'backend/services/integrationEvents.js', 'backend/test/integration-events-contract.test.js', 'backend/integration/integration-events-postgres.integration.test.js', 'artifacts/integration', 'docs/operations/p3-010-integration-events-operations-runbook.md'];
const result = spawnSync('git', args, { encoding: 'utf8' });
if (result.status !== 0 && result.status !== 1) {
  console.error(result.stderr || result.stdout || `git grep failed with status ${result.status}`);
  process.exit(result.status ?? 1);
}
const out = (result.stdout || '').trim().split('\n').filter(Boolean);
const allowed = out.filter((l) => /PAYLOAD_PROHIBITED|rejects secrets|normalizes separated secret key names|omits queues\/secrets|redaction|No sensitive|function hasBadKey|normalizePayloadKey|function hasBadValue|const pattern =/.test(l));
const bad = out.filter((l) => !allowed.includes(l));
if (bad.length) { console.error('P3_010_REDACTION_VIOLATION'); console.error(bad.join('\n')); process.exit(1); }
console.log('P3-010 redaction check passed.');
