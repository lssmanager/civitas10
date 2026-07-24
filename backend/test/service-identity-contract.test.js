const test = require('node:test');
const assert = require('node:assert/strict');
const { createStaticServiceIdentityProvider } = require('../planning/infrastructure/serviceIdentity');

test('service identity provider is injectable and rejects wrong audience runtime tenant or module', async () => {
  const provider = createStaticServiceIdentityProvider({ identity:'spiffe://civitas/gateway', credentialVersion:'fixture-v1', allowedAudiences:['planning-runtime:test'], allowedRuntimeIds:['rt-1'] });
  const ok = await provider.getIdentity({ audience:'planning-runtime:test', runtimeBindingId:'bind-1', runtimeId:'rt-1', moduleId:'planning', organizationId:'org-A', contractVersion:'planning-runtime/v1' });
  assert.equal(ok.identity, 'spiffe://civitas/gateway');
  await assert.rejects(() => provider.getIdentity({ audience:'other', runtimeBindingId:'bind-1', runtimeId:'rt-1', moduleId:'planning', organizationId:'org-A', contractVersion:'planning-runtime/v1' }), /audience/);
  await assert.rejects(() => provider.getIdentity({ audience:'planning-runtime:test', runtimeBindingId:'bind-1', runtimeId:'rt-2', moduleId:'planning', organizationId:'org-A', contractVersion:'planning-runtime/v1' }), /runtime/);
  await assert.rejects(() => provider.getIdentity({ audience:'planning-runtime:test', runtimeBindingId:'bind-1', runtimeId:'rt-1', moduleId:'crm', organizationId:'org-A', contractVersion:'planning-runtime/v1' }), /module/);
  await assert.rejects(() => provider.getIdentity({ audience:'planning-runtime:test', runtimeBindingId:'bind-1', runtimeId:'rt-1', moduleId:'planning', organizationId:'', contractVersion:'planning-runtime/v1' }), /tenant/);
});
