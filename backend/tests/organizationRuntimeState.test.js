const test = require("node:test");
const assert = require("node:assert/strict");

const {
  RuntimeStateInvalidCapabilityError,
  RuntimeStateInvalidKeyError,
  RuntimeStateNotFoundError,
  RuntimeStateUnsafeSecretError,
  createMemoryRuntimeStateStore,
} = require("../services/organizationRuntimeState");
const { deriveOperationalProfile } = require("../services/ownerOperationalProfile");

test("runtime state creates, reads and upserts by organization + capability + state_key", async () => {
  const store = createMemoryRuntimeStateStore();
  const created = await store.setRuntimeState({ logtoOrganizationId: "org-1", capability: "crm", stateKey: "crm.company_id", stateValue: "company-1", metadata: { provider: "fluentcrm", externalObject: "company" } });
  assert.equal(created.stateValue, "company-1");
  assert.equal(created.metadata.provider, "fluentcrm");

  const updated = await store.setRuntimeState({ logtoOrganizationId: "org-1", capability: "crm", stateKey: "crm.company_id", stateValue: "company-2", metadata: { provider: "fluentcrm", externalObject: "company" } });
  assert.equal(updated.stateValue, "company-2");
  assert.equal(store.size(), 1);

  const found = await store.getRuntimeState({ logtoOrganizationId: "org-1", capability: "crm", stateKey: "crm.company_id" });
  assert.equal(found.stateValue, "company-2");
});

test("runtime state composite key allows same key across organization and capability scopes", async () => {
  const store = createMemoryRuntimeStateStore();
  await store.setRuntimeState({ logtoOrganizationId: "org-1", capability: "crm", stateKey: "external.primary_id", stateValue: "crm-1" });
  await store.setRuntimeState({ logtoOrganizationId: "org-1", capability: "lms", stateKey: "external.primary_id", stateValue: "lms-1" });
  await store.setRuntimeState({ logtoOrganizationId: "org-2", capability: "crm", stateKey: "external.primary_id", stateValue: "crm-2" });

  assert.equal(store.size(), 3);
  assert.equal((await store.listRuntimeState({ logtoOrganizationId: "org-1" })).length, 2);
  assert.equal((await store.listRuntimeState({ logtoOrganizationId: "org-1", capability: "crm" })).length, 1);
});

test("runtime state rejects invalid capabilities, provider-first keys and secret-looking data", async () => {
  const store = createMemoryRuntimeStateStore();
  await assert.rejects(
    () => store.setRuntimeState({ logtoOrganizationId: "org-1", capability: "unknown", stateKey: "crm.company_id", stateValue: "company-1" }),
    RuntimeStateInvalidCapabilityError,
  );
  await assert.rejects(
    () => store.setRuntimeState({ logtoOrganizationId: "org-1", capability: "crm", stateKey: "fluentcrm.company_id", stateValue: "company-1" }),
    RuntimeStateInvalidKeyError,
  );
  await assert.rejects(
    () => store.setRuntimeState({ logtoOrganizationId: "org-1", capability: "crm", stateKey: "crm.company_id", stateValue: "company-1", metadata: { apiToken: "plain-secret" } }),
    RuntimeStateUnsafeSecretError,
  );
});

test("runtime state delete removes one composite key and reports missing state", async () => {
  const store = createMemoryRuntimeStateStore();
  await store.setRuntimeState({ logtoOrganizationId: "org-1", capability: "crm", stateKey: "crm.company_id", stateValue: "company-1" });
  const deleted = await store.deleteRuntimeState({ logtoOrganizationId: "org-1", capability: "crm", stateKey: "crm.company_id" });
  assert.equal(deleted.stateValue, "company-1");
  await assert.rejects(
    () => store.getRuntimeState({ logtoOrganizationId: "org-1", capability: "crm", stateKey: "crm.company_id" }),
    RuntimeStateNotFoundError,
  );
});

test("owner operational profile reads runtime state before legacy customData fallback", () => {
  const organization = {
    id: "org-1",
    name: "Org One",
    customData: { fluentcrmCompanyId: "legacy-company" },
  };
  const profile = deriveOperationalProfile(organization, {
    runtimeStateRows: [{ capability: "crm", stateKey: "crm.company_id", stateValue: "runtime-company", metadata: { provider: "fluentcrm" }, source: "organization_runtime_state", status: "active" }],
  });

  assert.equal(profile.fluentcrmCompanyId, "runtime-company");
  assert.equal(profile.runtimeState.crm.companyId, "runtime-company");
  assert.equal(profile.runtimeState.crm.source, "organization_runtime_state");
  assert.equal(profile.runtimeState.crm.provider, "fluentcrm");
  assert.notEqual(profile.runtimeState.crm.source, "fluentcrm");
  assert.equal(profile.legacy.customDataRuntimeStateFallback, false);
});

test("owner operational profile falls back to legacy customData only when runtime state is absent", () => {
  const profile = deriveOperationalProfile({ id: "org-1", customData: { civitasProfile: { downstream: { crm: { companyId: "legacy-company", provider: "fluentcrm" } } } } });
  assert.equal(profile.fluentcrmCompanyId, "legacy-company");
  assert.equal(profile.runtimeState.crm.companyId, "legacy-company");
  assert.equal(profile.runtimeState.crm.source, "legacy_logto_custom_data_fallback");
  assert.equal(profile.legacy.customDataRuntimeStateFallback, true);
});
