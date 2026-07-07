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
  constructor(capability, provider) { super(codes.PROVIDER_UNSUPPORTED, `Unknown provider: ${provider} for capability: ${capability}`, { capability, provider }); this.name = "ConnectorAdapterNotFoundError"; this.capability = capability; this.adapter = provider; this.status = 500; }
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
function resolve({ capability, provider, adapter = provider, orgId = null, config = {}, context = {} } = {}) {
  const providerKey = adapter || provider;
  if (!isSupportedCapability(capability)) throw connectorError(codes.CAPABILITY_UNSUPPORTED, `Unsupported capability ${capability}`, { capability });
  const factory = getFactory(capability, providerKey);
  if (!factory) throw connectorError(codes.PROVIDER_UNSUPPORTED, `Unsupported provider ${providerKey} for capability ${capability}`, { capability, provider: providerKey });
  const instance = factory(config, { orgId, capability, provider: providerKey, ...context });
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
  if (!row || row.status !== "connected") throw new ConnectorNotConfiguredError(capability, orgId);
  return resolve({ capability, provider: row.provider || row.adapter || row.connector, orgId, config: decrypt(row.config), context: { row } });
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
module.exports = { ConnectorContractViolationError, ADAPTER_MAP: ADAPTER_FACTORIES, ConnectorAdapterNotFoundError, ConnectorConfigError, ConnectorError, ConnectorNotConfiguredError, MockBaseAdapter, connectorRegistry: { resolve, registerAdapter, listRegisteredAdapters }, getConnector, listRegisteredAdapters, registerAdapter, resolve, codes };
