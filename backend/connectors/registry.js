const { assertKnownCapability, createAdapterHealth, ADAPTER_HEALTH_STATUSES } = require("../contracts/foundation");

const ADAPTER_MAP = new Map();

class ConnectorNotConfiguredError extends Error {
  constructor(capability, orgId) {
    super(`Org ${orgId} does not have an active connector for capability: ${capability}`);
    this.name = "ConnectorNotConfiguredError";
    this.capability = capability;
    this.org_id = orgId;
    this.status = 422;
  }
}

class ConnectorAdapterNotFoundError extends Error {
  constructor(capability, adapter) {
    super(`Unknown adapter: ${adapter} for capability: ${capability}`);
    this.name = "ConnectorAdapterNotFoundError";
    this.capability = capability;
    this.adapter = adapter;
    this.status = 500;
  }
}

class ConnectorConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConnectorConfigError";
    this.status = 422;
  }
}

const adapterKey = (capability, adapter) => `${capability}:${adapter}`;

function registerAdapter(capability, adapter, factory) {
  assertKnownCapability(capability);
  if (!adapter || typeof adapter !== "string") throw new ConnectorConfigError("adapter name is required");
  if (typeof factory !== "function") throw new ConnectorConfigError("adapter factory must be a function");
  ADAPTER_MAP.set(adapterKey(capability, adapter), factory);
}

function listRegisteredAdapters() {
  return [...ADAPTER_MAP.keys()].map((key) => {
    const [capability, adapter] = key.split(":");
    return { capability, adapter };
  });
}

async function defaultConnectorRowLoader() {
  return null;
}

function defaultDecrypt(config) {
  return config || {};
}

async function getConnector(orgId, capability, options = {}) {
  assertKnownCapability(capability);
  const loadConnectorRow = options.loadConnectorRow || defaultConnectorRowLoader;
  const decrypt = options.decrypt || defaultDecrypt;
  const row = await loadConnectorRow({ orgId, capability });

  if (!row || row.status !== "connected") {
    throw new ConnectorNotConfiguredError(capability, orgId);
  }

  const factory = ADAPTER_MAP.get(adapterKey(capability, row.adapter));
  if (!factory) {
    throw new ConnectorAdapterNotFoundError(capability, row.adapter);
  }

  return factory(decrypt(row.config), { orgId, capability, adapter: row.adapter, row });
}

class MockBaseAdapter {
  constructor(config = {}, metadata = {}) {
    this.config = config;
    this.metadata = metadata;
  }

  async ping() {
    return createAdapterHealth({
      status: this.config.status || ADAPTER_HEALTH_STATUSES.HEALTHY,
      latencyMs: Number(this.config.latencyMs || 0),
      lastSuccessfulPing: this.config.lastSuccessfulPing || new Date().toISOString(),
    });
  }

  async getOperationalState() {
    return { adapter: this.metadata.adapter || "mock", capability: this.metadata.capability || null };
  }
}

module.exports = {
  ADAPTER_MAP,
  ConnectorAdapterNotFoundError,
  ConnectorConfigError,
  ConnectorNotConfiguredError,
  MockBaseAdapter,
  getConnector,
  listRegisteredAdapters,
  registerAdapter,
};
