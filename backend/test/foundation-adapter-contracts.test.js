const test = require("node:test");
const assert = require("node:assert/strict");

const { createLogtoAdapter } = require("../connectors/identity/logto");
const { MockBaseAdapter } = require("../connectors/registry");
const {
  ConnectorContractViolationError,
  validateAdapterContract,
  validateAdapterHealth,
} = require("../connectors/adapters/contracts");

test("adapter without ping fails with ConnectorContractViolationError", () => {
  assert.throws(() => validateAdapterContract({ capability: "identity" }, { capability: "identity" }), ConnectorContractViolationError);
});

test("invalid adapter capability fails", () => {
  assert.throws(() => validateAdapterContract({ capability: "erp", ping() {} }, { capability: "erp" }), ConnectorContractViolationError);
});

test("mock adapter passes foundation contract and health validation", async () => {
  const adapter = new MockBaseAdapter({}, { capability: "lms", provider: "mock" });
  validateAdapterContract(adapter, { capability: "lms" });
  validateAdapterHealth(await adapter.ping());
});

test("identity logto adapter passes foundation contract and health validation", async () => {
  const adapter = createLogtoAdapter({ endpoint: "https://logto.example", managementApiResource: "https://logto.example/api" });
  validateAdapterContract(adapter, { capability: "identity" });
  validateAdapterHealth(await adapter.ping());
});
