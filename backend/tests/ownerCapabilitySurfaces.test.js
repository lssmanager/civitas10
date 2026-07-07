const test = require('node:test');
const assert = require('node:assert/strict');
const {
  OWNER_CAPABILITIES,
  buildOwnerOperationalStateResponse,
  buildOwnerRegistryPayload,
  ownerQueueSignal,
} = require('../services/ownerCapabilitySurfaces');

test('owner registry payload is rooted by capabilities, not providers', () => {
  const payload = buildOwnerRegistryPayload([
    { capability: 'crm', adapter: 'fluentcrm', adapterStatus: 'available' },
    { capability: 'lms', adapter: 'moodle', adapterStatus: 'available' },
  ]);

  assert.ok(Array.isArray(payload.capabilities));
  assert.equal(Object.hasOwn(payload, 'fluentcrm'), false);
  assert.equal(Object.hasOwn(payload, 'moodle'), false);
  const crm = payload.capabilities.find((item) => item.capability === 'crm');
  assert.deepEqual(crm.availableAdapters[0], {
    key: 'fluentcrm',
    label: 'FluentCRM',
    status: 'available',
    healthSupported: true,
    configurationRequired: true,
  });
});

test('owner operational-state response exposes capability contract and encapsulates adapter details', () => {
  const response = buildOwnerOperationalStateResponse({
    baseResponse: { generatedAt: '2026-07-07T10:00:00.000Z', summary: { status: 'degraded' }, fluentcrm: { status: 'linked' } },
    organization: { logtoOrganizationId: 'org-1', name: 'Colegio Uno' },
    connectorRows: [{ capability: 'crm', adapter: 'fluentcrm', bindingStatus: 'active', connectorStatus: 'configured', adapterStatus: 'available', status: 'connected', lastPingAt: '2026-07-07T09:00:00.000Z' }],
    runtimeStateRows: [{ capability: 'crm', stateKey: 'crm.company_id', stateValue: 'company-123', source: 'organization_runtime_state', status: 'active', metadata: { provider: 'fluentcrm' } }],
  });

  assert.equal(Object.hasOwn(response, 'fluentcrm'), false);
  assert.equal(Object.hasOwn(response, 'moodle'), false);
  assert.equal(response.organization.logtoOrganizationId, 'org-1');
  assert.ok(Array.isArray(response.capabilities));
  const crm = response.capabilities.find((item) => item.capability === 'crm');
  assert.equal(crm.configured, true);
  assert.equal(crm.adapter.key, 'fluentcrm');
  assert.equal(crm.health.status, 'healthy');
  assert.equal(crm.runtimeState.source, 'organization_runtime_state');
  assert.equal(crm.runtimeState.summary.companyId, 'company-123');
  assert.deepEqual(crm.blockers, []);
  assert.deepEqual(crm.nextActions, []);
});

test('unconfigured capability is an expected owner state with blocker and next action', () => {
  const response = buildOwnerOperationalStateResponse({ organization: { logtoOrganizationId: 'org-1' }, capabilities: OWNER_CAPABILITIES });
  const lms = response.capabilities.find((item) => item.capability === 'lms');

  assert.equal(lms.configured, false);
  assert.equal(lms.adapter, null);
  assert.equal(lms.health.status, 'not_configured');
  assert.equal(lms.blockers[0].code, 'connector_not_configured');
  assert.equal(lms.blockers[0].severity, 'info');
  assert.equal(lms.nextActions[0].type, 'configure_connector');
  assert.deepEqual(lms.nextActions[0].target, { capability: 'lms' });
});

test('legacy customData fallback is marked and not promoted as provider-root payload', () => {
  const response = buildOwnerOperationalStateResponse({
    organization: { logtoOrganizationId: 'org-1' },
    profile: { legacy: { customDataRuntimeStateFallback: true }, runtimeState: { crm: { companyId: 'legacy-company', provider: 'fluentcrm' } } },
  });
  const crm = response.capabilities.find((item) => item.capability === 'crm');

  assert.equal(crm.runtimeState.source, 'legacy_custom_data');
  assert.equal(crm.runtimeState.legacy, true);
  assert.equal(crm.runtimeState.summary.companyId, 'legacy-company');
  assert.equal(Object.hasOwn(response, 'fluentcrm'), false);
});

test('worker queue owner signal includes impact and actionable nextAction', () => {
  const signal = ownerQueueSignal({ queueName: 'sync', classification: 'backlog_growing' });

  assert.equal(signal.code, 'worker_queue_degraded');
  assert.equal(signal.severity, 'warning');
  assert.match(signal.impact, /conectores/);
  assert.equal(signal.nextAction.type, 'inspect_queue');
  assert.deepEqual(signal.nextAction.target, { queue: 'sync' });
});
