const test = require("node:test");
const assert = require("node:assert/strict");

const {
  ConnectorAdapterNotFoundError,
  ConnectorBindingConflictError,
  ConnectorNotConfiguredError,
  getConnector,
  listRegisteredAdapters,
} = require("../connectors/registry");
const { MockLMSAdapter, registerMockAdapters } = require("../connectors/adapters/mock");
const { assertNoPlaintextSecrets } = require("../services/registryStore");

registerMockAdapters();

test("registry resolves the configured adapter by organization + capability", async () => {
  const calls = [];
  const lms = await getConnector("org-uuid", "lms", {
    loadConnectorRow: async ({ orgId, capability }) => {
      calls.push({ orgId, capability });
      return {
        orgId,
        capability,
        adapter: "mock",
        status: "connected",
        config: { latencyMs: 7 },
        secretsRef: "vault://civitas/org-uuid/lms/mock",
      };
    },
  });

  assert.deepEqual(calls, [{ orgId: "org-uuid", capability: "lms" }]);
  assert.ok(lms instanceof MockLMSAdapter);
  const health = await lms.ping();
  assert.equal(health.status, "HEALTHY");
  assert.equal(health.latency_ms, 7);
  assert.ok(listRegisteredAdapters().some((item) => item.capability === "lms" && item.adapter === "mock"));
});

test("registry throws a typed error when capability is not configured", async () => {
  await assert.rejects(
    () => getConnector("org-uuid", "crm", { loadConnectorRow: async () => null }),
    ConnectorNotConfiguredError,
  );
});

test("registry throws a typed conflict when organization + capability has multiple active bindings", async () => {
  await assert.rejects(
    () => getConnector("org-uuid", "crm", { loadConnectorRow: async () => ({ conflict: true, rows: [{ id: 1 }, { id: 2 }] }) }),
    ConnectorBindingConflictError,
  );
});

test("registry throws a typed adapter error when configured adapter is not registered", async () => {
  await assert.rejects(
    () => getConnector("org-uuid", "crm", {
      loadConnectorRow: async () => ({ capability: "crm", adapter: "not-installed", status: "connected", config: {} }),
    }),
    ConnectorAdapterNotFoundError,
  );
});

test("public registry lookup does not require provider-first input", async () => {
  const connector = await getConnector("org-uuid", "lms", {
    loadConnectorRow: async ({ orgId, capability, provider }) => {
      assert.equal(provider, undefined);
      return { orgId, capability, adapter: "mock", status: "connected", config: {} };
    },
  });
  assert.equal(connector.capability, "lms");
  assert.equal(connector.provider, "mock");
});

test("connector config rejects plaintext secret-looking fields and allows secretsRef strategy", () => {
  assert.doesNotThrow(() => assertNoPlaintextSecrets({ baseUrl: "https://example.test", tenant: "academy" }));
  assert.throws(
    () => assertNoPlaintextSecrets({ baseUrl: "https://example.test", apiToken: "plain" }),
    /secret-looking fields/,
  );
});
