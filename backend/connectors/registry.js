const { VALID_CAPABILITIES, HealthStatus, createAdapterHealth, isSupportedCapability, validateAdapter, ConnectorContractViolationError } = require("./adapters/contracts");
const { ConnectorError, codes, connectorError } = require("./errors");
const { createLogtoAdapter } = require("./identity/logto");
const { createFluentCrmAdapter } = require("./crm/fluentcrm");

const ADAPTER_FACTORIES = new Map();
const legacyKey = (capability, provider) => `${capability}:${provider}`;

class ConnectorNotConfiguredError extends ConnectorError {
  constructor(capability, orgId) { super(codes.NOT_CONFIGURED, `Org ${orgId} does not have an active connector for capability: ${capability}`, { capability, orgId }); this.name = "ConnectorNotConfiguredError"; this.capability = capability; this.org_id = orgId; this.status = 422; }
}
class ConnectorAdapterNotFoundError extends ConnectorError {
  constructor(capability, adapter, orgId = null) { super(codes.PROVIDER_UNSUPPORTED, `Adapter not registered for capability: ${capability}`, { capability, adapter, orgId }); this.name = "ConnectorAdapterNotFoundError"; this.capability = capability; this.adapter = adapter; this.org_id = orgId; this.status = 500; }
}
class ConnectorBindingConflictError extends ConnectorError {
  constructor(capability, orgId, count = 0) { super("CONNECTOR_BINDING_CONFLICT", `Org ${orgId} has ${count || "multiple"} active connector bindings for capability: ${capability}`, { capability, orgId, count }); this.name = "ConnectorBindingConflictError"; this.capability = capability; this.org_id = orgId; this.status = 409; }
}
class ConnectorConfigError extends ConnectorError {
  constructor(message, details = {}) { super(codes.CONFIG_INVALID, message, details); this.name = "ConnectorConfigError"; this.status = 422; }
}
function registerAdapter(capability, provider, factory) {
  if (!isSupportedCapability(capability)) throw connectorError(codes.CAPABILITY_UNSUPPORTED, `Unsupported capability ${capability}`, { capability });
  if (!provider || typeof provider !== "string") throw new ConnectorConfigError("provider name is required");
  if (typeof factory !== "function") throw new ConnectorConfigError("adapter factory must be a function");
  ADAPTER_FACTORIES.set(legacyKey(capability, provider), factory);
}
function listRegisteredAdapters() { return [...ADAPTER_FACTORIES.keys()].map((key) => { const [capability, provider] = key.split(":"); return { capability, provider, adapter: provider }; }); }
function getFactory(capability, provider) { return ADAPTER_FACTORIES.get(legacyKey(capability, provider)); }
function resolve({ capability, adapter, provider = adapter, orgId = null, config = {}, context = {} } = {}) {
  const adapterKey = adapter || provider;
  if (!isSupportedCapability(capability)) throw connectorError(codes.CAPABILITY_UNSUPPORTED, `Unsupported capability ${capability}`, { capability });
  const factory = getFactory(capability, adapterKey);
  if (!factory) throw new ConnectorAdapterNotFoundError(capability, adapterKey, orgId);
  const instance = factory(config, { orgId, capability, adapter: adapterKey, provider: adapterKey, ...context });
  validateAdapter(instance);
  return instance;
}
async function defaultConnectorRowLoader({ orgId, capability }) { const { loadConnectorRow } = require("../services/registryStore"); return loadConnectorRow({ orgId, capability }); }
function defaultDecrypt(config) { return config || {}; }
async function getConnector(orgId, capability, options = {}) {
  if (!isSupportedCapability(capability)) throw connectorError(codes.CAPABILITY_UNSUPPORTED, `Unsupported capability ${capability}`, { capability });
  const loadConnectorRow = options.loadConnectorRow || defaultConnectorRowLoader;
  const decrypt = options.decrypt || defaultDecrypt;
  const row = await loadConnectorRow({ orgId, capability });
  if (row?.conflict) throw new ConnectorBindingConflictError(capability, orgId, row.rows?.length);
  if (!row || row.status !== "connected") throw new ConnectorNotConfiguredError(capability, orgId);
  if (!row.adapter) throw new ConnectorAdapterNotFoundError(capability, row.adapter, orgId);
  return resolve({ capability, adapter: row.adapter, orgId, config: decrypt(row.config, row.secretsRef), context: { row, secretsRef: row.secretsRef } });
}
class MockBaseAdapter {
  constructor(config = {}, metadata = {}) { this.config = config; this.metadata = metadata; this.name = metadata.provider || metadata.adapter || config.provider || "mock"; this.capability = metadata.capability || config.capability || "support"; this.provider = this.name; this.version = "1.0.0"; this.actions = config.actions || ["system.echo"]; }
  validate() { return true; }
  async healthCheck() { return createAdapterHealth({ status: this.config.status || HealthStatus.HEALTHY, latencyMs: Number(this.config.latencyMs || 0), lastSuccessfulPing: this.config.lastSuccessfulPing || new Date().toISOString() }); }
  async healthcheck() { const health = await this.healthCheck(); return { status: health.status, latency_ms: health.latency_ms ?? null, message: health.error || null, last_successful_ping: health.last_successful_ping ?? null }; }
  async execute(action, input) { if (!this.actions.includes(action)) throw connectorError(codes.ACTION_UNSUPPORTED, `Unsupported mock action ${action}`, { action }); return { action, input, adapter: this.provider, capability: this.capability }; }
  async ping() { return this.healthcheck(); }
  async getOperationalState() { return { adapter: this.provider, capability: this.capability }; }
}
function registerBuiltInAdapters() {
  registerAdapter("identity", "logto", createLogtoAdapter);
  registerAdapter("crm", "fluentcrm", createFluentCrmAdapter);
  for (const capability of VALID_CAPABILITIES) registerAdapter(capability, "mock", (config, metadata) => new MockBaseAdapter(config, metadata));
}
registerBuiltInAdapters();
module.exports = { ConnectorContractViolationError, ADAPTER_MAP: ADAPTER_FACTORIES, ConnectorAdapterNotFoundError, ConnectorBindingConflictError, ConnectorConfigError, ConnectorError, ConnectorNotConfiguredError, MockBaseAdapter, connectorRegistry: { resolve, registerAdapter, listRegisteredAdapters }, getConnector, listRegisteredAdapters, registerAdapter, resolve, codes };
