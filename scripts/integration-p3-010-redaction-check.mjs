#!/usr/bin/env node
import { execSync } from 'node:child_process';
const out=execSync("git grep -nE \"accessToken|refreshToken|bearerToken|clientSecret|privateKey|Authorization:|rawProviderResponse\" -- contracts/integration backend/services/integrationEvents.js backend/test/integration-events-contract.test.js backend/integration/integration-events-postgres.integration.test.js artifacts/integration docs/operations/p3-010-integration-events-operations-runbook.md 2>/dev/null || true",{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const allowed=out.filter(l=>/PAYLOAD_PROHIBITED|rejects secrets|redaction|No sensitive/.test(l));
const bad=out.filter(l=>!allowed.includes(l));
if(bad.length){console.error('P3_010_REDACTION_VIOLATION');console.error(bad.join('\n'));process.exit(1)}
console.log('P3-010 redaction check passed.');
