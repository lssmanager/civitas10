const test = require('node:test');
const assert = require('node:assert/strict');
const { buildGovernanceReadModel, assertTenantRouteMatchesContext, GOVERNANCE_READ_MODEL_CONTRACT_VERSION } = require('../services/governanceReadModel');

test('governance read model exposes versioned aggregate without PII graphs', () => {
  const response = buildGovernanceReadModel({ organizationId: 'org-1', organization: { id: 'org-1', name: 'Colegio Uno' }, surface: 'owner' });

  assert.equal(response.contractVersion, GOVERNANCE_READ_MODEL_CONTRACT_VERSION);
  assert.equal(response.surface, 'owner');
  assert.equal(response.runtimeStatus, 'current');
  assert.equal(response.modules.permissions.status, 'active');
  assert.equal(response.modules['access-preview'].status, 'planned');
  assert.equal(Array.isArray(response.permissionMatrix), true);
  assert.equal(Object.hasOwn(response, 'assignmentGraph'), false);
  assert.equal(Object.hasOwn(response, 'rawToken'), false);
});

test('tenant governance route must match verified organization context', () => {
  assert.doesNotThrow(() => assertTenantRouteMatchesContext({ params: { organizationId: 'org-1' }, user: { organizationId: 'org-1' } }));
  assert.throws(() => assertTenantRouteMatchesContext({ params: { organizationId: 'org-1' }, user: { organizationId: 'org-2' } }), /Tenant governance route organization/);
});

test('stale governance runtime is distinct from unavailable modules', () => {
  const response = buildGovernanceReadModel({ organizationId: 'org-1', surface: 'tenant', stale: true });

  assert.equal(response.runtimeStatus, 'stale');
  assert.equal(response.modules.permissions.status, 'stale');
  assert.equal(response.modules['access-preview'].status, 'stale');
  assert.ok(response.diagnostics.some((item) => item.code === 'authorization_snapshot_stale'));
});
