const { getDb, schema } = require("../lib/db");
const { buildOwnerRegistryPayload } = require("./ownerCapabilitySurfaces");
function orm() { return require("drizzle-orm"); }

const SECRET_KEY_PATTERN = /(secret|token|password|apikey|api_key|private[_-]?key|client[_-]?secret|credential)/i;

function assertNoPlaintextSecrets(config = {}) {
  const offenders = [];
  function visit(value, path = []) {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      const nextPath = [...path, key];
      if (SECRET_KEY_PATTERN.test(key) && child !== null && child !== undefined && child !== "") offenders.push(nextPath.join("."));
      if (child && typeof child === "object" && !Array.isArray(child)) visit(child, nextPath);
    }
  }
  visit(config);
  if (offenders.length > 0) {
    const error = new Error(`Connector config contains secret-looking fields (${offenders.join(", ")}); persist only non-sensitive config and pass secretsRef`);
    error.code = "CONNECTOR_CONFIG_CONTAINS_PLAINTEXT_SECRET";
    error.fields = offenders;
    throw error;
  }
}

async function ensureCapability({ key, description = null, contract = {} }) {
  const db = getDb();
  const [row] = await db.insert(schema.capabilities).values({ key, description, contract }).onConflictDoUpdate({ target: schema.capabilities.key, set: { description, contract, updatedAt: new Date() } }).returning();
  return row;
}

async function registerRegistryAdapter({ capabilityKey, adapterKey, moduleRef = null, status = "available", operationalConfigSchema = {}, metadata = {} }) {
  const capability = await ensureCapability({ key: capabilityKey });
  const [row] = await getDb().insert(schema.adapters).values({ capabilityId: capability.id, key: adapterKey, moduleRef, status, operationalConfigSchema, metadata }).onConflictDoUpdate({ target: [schema.adapters.capabilityId, schema.adapters.key], set: { moduleRef, status, operationalConfigSchema, metadata, updatedAt: new Date() } }).returning();
  return row;
}

async function registerConnector({ capabilityKey, adapterKey, connectorKey, config = {}, secretsRef = null, status = "configured" }) {
  assertNoPlaintextSecrets(config);
  const adapter = await registerRegistryAdapter({ capabilityKey, adapterKey });
  const [row] = await getDb().insert(schema.connectors).values({ adapterId: adapter.id, key: connectorKey, config, secretsRef, status }).onConflictDoUpdate({ target: [schema.connectors.adapterId, schema.connectors.key], set: { config, secretsRef, status, updatedAt: new Date() } }).returning();
  return row;
}

async function findCapabilityId(capabilityKey) {
  const [capability] = await getDb().select({ id: schema.capabilities.id }).from(schema.capabilities).where(orm().eq(schema.capabilities.key, capabilityKey)).limit(1);
  return capability?.id || null;
}

async function bindConnector({ connectorId, capabilityKey, capability, logtoOrganizationId, orgId = logtoOrganizationId, routingConfig = {}, status = "active", scopeType = "tenant" }) {
  const capabilityId = await findCapabilityId(capabilityKey || capability);
  if (!capabilityId) throw Object.assign(new Error(`Unknown capability: ${capabilityKey || capability}`), { code: "CONNECTOR_CAPABILITY_UNKNOWN" });
  const [row] = await getDb().insert(schema.connectorBindings).values({ connectorId, capabilityId, scopeType, logtoOrganizationId: orgId, routingConfig, status, isActive: status === "active" }).returning();
  return row;
}

async function configureOrgConnector({ logtoOrganizationId, orgId = logtoOrganizationId, capability, adapterKey, connectorKey = `${orgId}:${capability}`, config = {}, secretsRef = null, routingConfig = {}, status = "active" }) {
  const connector = await registerConnector({ capabilityKey: capability, adapterKey, connectorKey, config, secretsRef, status: status === "active" ? "configured" : status });
  return bindConnector({ connectorId: connector.id, capability, logtoOrganizationId: orgId, routingConfig, status });
}

async function loadConnectorRows({ orgId, logtoOrganizationId = orgId, capability, activeOnly = true }) {
  const where = [orm().eq(schema.capabilities.key, capability), orm().eq(schema.connectorBindings.logtoOrganizationId, logtoOrganizationId)];
  if (activeOnly) where.push(orm().eq(schema.connectorBindings.isActive, true));
  return getDb().select({
    orgId: schema.connectorBindings.logtoOrganizationId,
    capability: schema.capabilities.key,
    adapter: schema.adapters.key,
    connector: schema.connectors.key,
    bindingStatus: schema.connectorBindings.status,
    connectorStatus: schema.connectors.status,
    adapterStatus: schema.adapters.status,
    config: schema.connectors.config,
    secretsRef: schema.connectors.secretsRef,
    lastPingAt: schema.connectors.lastPingAt,
    lastErrorJson: schema.connectors.lastErrorJson,
    routingConfig: schema.connectorBindings.routingConfig,
    bindingId: schema.connectorBindings.id,
    connectorId: schema.connectors.id,
    adapterId: schema.adapters.id,
  }).from(schema.connectorBindings)
    .innerJoin(schema.connectors, orm().eq(schema.connectorBindings.connectorId, schema.connectors.id))
    .innerJoin(schema.adapters, orm().eq(schema.connectors.adapterId, schema.adapters.id))
    .innerJoin(schema.capabilities, orm().eq(schema.connectorBindings.capabilityId, schema.capabilities.id))
    .where(orm().and(...where));
}

async function loadConnectorRow({ orgId, logtoOrganizationId = orgId, capability }) {
  const rows = await loadConnectorRows({ logtoOrganizationId, capability });
  if (rows.length === 0) return null;
  if (rows.length > 1) return { conflict: true, rows, capability, orgId: logtoOrganizationId };
  const row = rows[0];
  return { ...row, status: row.bindingStatus === "active" && row.connectorStatus === "configured" ? "connected" : row.bindingStatus };
}

async function listRegistryRows() {
  return getDb().select({ capability: schema.capabilities.key, adapter: schema.adapters.key, connector: schema.connectors.key, connectorStatus: schema.connectors.status, adapterStatus: schema.adapters.status }).from(schema.capabilities).leftJoin(schema.adapters, orm().eq(schema.adapters.capabilityId, schema.capabilities.id)).leftJoin(schema.connectors, orm().eq(schema.connectors.adapterId, schema.adapters.id));
}

async function listRegistry() {
  return buildOwnerRegistryPayload(await listRegistryRows());
}

module.exports = { assertNoPlaintextSecrets, bindConnector, configureOrgConnector, ensureCapability, listRegistry, listRegistryRows, loadConnectorRow, loadConnectorRows, registerConnector, registerRegistryAdapter };
