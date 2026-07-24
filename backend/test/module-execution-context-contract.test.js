const test = require('node:test');
const assert = require('node:assert/strict');
const { createHmacModuleExecutionContextIssuer, createHmacModuleExecutionContextValidator } = require('../planning/infrastructure/moduleExecutionContext');

const base = () => ({
  organizationId:'org-A', subjectId:'sub-1', clientId:'client-1', audience:'planning-runtime:test', runtimeId:'rt-1', moduleId:'planning', contractVersion:'planning-runtime/v1',
  operation:{ moduleId:'planning', capabilityId:'planning.plans', operationId:'planning.plans.create', actionId:'planning.plans.create', executionKind:'write' },
  authorizationDecision:{ decisionId:'authz-1', authorizationSnapshotVersion:'1', organizationId:'org-A' },
  availabilityDecision:{ decisionId:'avail-1', version:'1', runtimeBindingVersion:'7', compatibilityVersion:'cmp-1', runtimeId:'rt-1' },
  correlationId:'corr-1', idempotency:{ key:'idem-1', requestFingerprint:'fp-1' }
});

test('ModuleExecutionContext rejects signature, audience, expiry, replay, tenant and malformed unknown payloads', async () => {
  const replayStore = new Set();
  const issuer = createHmacModuleExecutionContextIssuer({ secret:'secret-a', ttlMs:1000, clock:()=>new Date('2026-07-24T00:00:00.000Z'), nonceFactory:()=> 'jti-1' });
  const validator = createHmacModuleExecutionContextValidator({ secret:'secret-a', clock:()=>new Date('2026-07-24T00:00:00.500Z'), replayStore });
  const issued = await issuer.issue(base());
  const expected = { issuer:'civitas-runtime-control-plane', organizationId:'org-A', audience:'planning-runtime:test', runtimeId:'rt-1', moduleId:'planning', contractVersion:'planning-runtime/v1', correlationId:'corr-1', decisionId:'authz-1', runtimeBindingVersion:'7' };
  assert.equal(validator.validate(issued.serialized, expected).ok, true);
  assert.equal(validator.validate(issued.serialized, expected).reason, 'replay');
  assert.equal(createHmacModuleExecutionContextValidator({ secret:'secret-b' }).validate(issued.serialized, expected).reason, 'invalid_signature');
  assert.equal(createHmacModuleExecutionContextValidator({ secret:'secret-a' }).validate(issued.serialized, { ...expected, audience:'other' }).reason, 'wrong_audience');
  assert.equal(createHmacModuleExecutionContextValidator({ secret:'secret-a' }).validate(issued.serialized, { ...expected, organizationId:'org-B' }).reason, 'wrong_organizationId');
  assert.equal(createHmacModuleExecutionContextValidator({ secret:'secret-a', clock:()=>new Date('2026-07-24T00:00:02.000Z') }).validate(issued.serialized, expected).reason, 'expired');
  assert.equal(createHmacModuleExecutionContextValidator({ secret:'secret-a' }).validate('not-json.not-a-signature', expected).reason, 'invalid_signature');
});
