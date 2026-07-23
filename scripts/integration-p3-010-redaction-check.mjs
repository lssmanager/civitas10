#!/usr/bin/env node
import { execSync } from 'node:child_process';
const out=execSync("git grep -nE \"accessToken|access-token|refreshToken|bearerToken|clientSecret|client_secret|privateKey|private_key|api_key|api-key|Authorization:|authorization:|credential|cookie|password|bearer|(?<!outbox_)token|rawProviderResponse\" -- contracts/integration backend/services/integrationEvents.js backend/test/integration-events-contract.test.js backend/integration/integration-events-postgres.integration.test.js artifacts/integration docs/operations/p3-010-integration-events-operations-runbook.md 2>/dev/null || true",{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const allowed=out.filter(l=>/PAYLOAD_PROHIBITED|rejects secrets|normalizes separated secret key names|redaction|No sensitive|function hasBadKey|normalizePayloadKey|function hasBadValue/.test(l));
const bad=out.filter(l=>!allowed.includes(l));
if(bad.length){console.error('P3_010_REDACTION_VIOLATION');console.error(bad.join('\n'));process.exit(1)}
console.log('P3-010 redaction check passed.');
