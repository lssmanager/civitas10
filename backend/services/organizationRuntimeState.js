const { VALID_CAPABILITIES } = require("../connectors/adapters/contracts");
const { getDb, schema } = require("../lib/db");

function orm() { return require("drizzle-orm"); }

const PROVIDER_KEY_PREFIXES = new Set(["fluentcrm", "moodle", "buddyboss", "wordpress", "stripe"]);
const GENERIC_KEY_PREFIXES = new Set(["external", "sync", "integration", "default", "health", "mapping"]);
const SECRET_KEY_PATTERN = /(secret|token|password|apikey|api_key|private[_-]?key|client[_-]?secret|credential|authorization|bearer)/i;
const STATE_KEY_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

class RuntimeStateError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = "RuntimeStateError"; this.code = code; this.details = details; this.status = 422; }
}
class RuntimeStateNotFoundError extends RuntimeStateError {
  constructor(filter = {}) { super("RUNTIME_STATE_NOT_FOUND", "Organization runtime state was not found", filter); this.name = "RuntimeStateNotFoundError"; this.status = 404; }
}
class RuntimeStateInvalidCapabilityError extends RuntimeStateError {
  constructor(capability) { super("RUNTIME_STATE_INVALID_CAPABILITY", `Unsupported runtime state capability: ${capability}`, { capability }); this.name = "RuntimeStateInvalidCapabilityError"; }
}
class RuntimeStateInvalidKeyError extends RuntimeStateError {
  constructor(stateKey, capability) { super("RUNTIME_STATE_INVALID_KEY", `Invalid runtime state key: ${stateKey}`, { stateKey, capability }); this.name = "RuntimeStateInvalidKeyError"; }
}
class RuntimeStateUnsafeSecretError extends RuntimeStateError {
  constructor(paths = []) { super("RUNTIME_STATE_UNSAFE_SECRET", `Runtime state contains secret-looking data at: ${paths.join(", ")}`, { paths }); this.name = "RuntimeStateUnsafeSecretError"; }
}

function assertValidCapability(capability) {
  if (!VALID_CAPABILITIES.includes(capability)) throw new RuntimeStateInvalidCapabilityError(capability);
}

function assertValidStateKey({ capability, stateKey }) {
  if (!stateKey || typeof stateKey !== "string" || !STATE_KEY_PATTERN.test(stateKey)) throw new RuntimeStateInvalidKeyError(stateKey, capability);
  const [prefix] = stateKey.split(".");
  if (PROVIDER_KEY_PREFIXES.has(prefix)) throw new RuntimeStateInvalidKeyError(stateKey, capability);
  if (VALID_CAPABILITIES.includes(prefix) && prefix !== capability) throw new RuntimeStateInvalidKeyError(stateKey, capability);
  if (!VALID_CAPABILITIES.includes(prefix) && !GENERIC_KEY_PREFIXES.has(prefix)) throw new RuntimeStateInvalidKeyError(stateKey, capability);
}

function assertNoSecrets(value, path = "state") {
  const offenders = [];
  function visit(current, currentPath) {
    if (current == null) return;
    if (typeof current === "string") {
      if (SECRET_KEY_PATTERN.test(currentPath) || /^(bearer\s+|sk_(live|test)_|pk_(live|test)_|xox[baprs]-)/i.test(current) || /^(eyJ[A-Za-z0-9_-]+\.){2}/.test(current)) offenders.push(currentPath);
      return;
    }
    if (typeof current !== "object") return;
    for (const [key, child] of Object.entries(current)) {
      const nextPath = `${currentPath}.${key}`;
      if (SECRET_KEY_PATTERN.test(key) && child !== null && child !== undefined && child !== "") offenders.push(nextPath);
      visit(child, nextPath);
    }
  }
  visit(value, path);
  if (offenders.length) throw new RuntimeStateUnsafeSecretError([...new Set(offenders)]);
}

function validateRuntimeStateInput({ logtoOrganizationId, capability, stateKey, stateValue = null, metadata = {}, lastError = null } = {}) {
  if (!logtoOrganizationId || typeof logtoOrganizationId !== "string") throw new RuntimeStateError("RUNTIME_STATE_INVALID_ORGANIZATION", "logtoOrganizationId is required", { logtoOrganizationId });
  assertValidCapability(capability);
  assertValidStateKey({ capability, stateKey });
  assertNoSecrets({ stateValue, metadata, lastError }, "runtimeState");
}

function normalizeRow(row = {}) {
  if (!row) return null;
  return {
    id: row.id,
    logtoOrganizationId: row.logtoOrganizationId,
    capability: row.capability,
    stateKey: row.stateKey,
    stateValue: row.stateValue,
    metadata: row.metadata || {},
    source: row.source || "organization_runtime_state",
    status: row.status || "active",
    lastSyncedAt: row.lastSyncedAt || null,
    lastError: row.lastError || null,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
  };
}

async function getRuntimeState({ logtoOrganizationId, capability, stateKey }) {
  validateRuntimeStateInput({ logtoOrganizationId, capability, stateKey });
  const [row] = await getDb().select().from(schema.organizationRuntimeState).where(orm().and(
    orm().eq(schema.organizationRuntimeState.logtoOrganizationId, logtoOrganizationId),
    orm().eq(schema.organizationRuntimeState.capability, capability),
    orm().eq(schema.organizationRuntimeState.stateKey, stateKey),
  )).limit(1);
  if (!row) throw new RuntimeStateNotFoundError({ logtoOrganizationId, capability, stateKey });
  return normalizeRow(row);
}

async function setRuntimeState({ logtoOrganizationId, capability, stateKey, stateValue = null, metadata = {}, source = "organization_runtime_state", status = "active", lastSyncedAt = null, lastError = null }) {
  validateRuntimeStateInput({ logtoOrganizationId, capability, stateKey, stateValue, metadata, lastError });
  const normalizedStateValue = stateValue == null ? null : String(stateValue);
  const values = { logtoOrganizationId, capability, stateKey, stateValue: normalizedStateValue, metadata, source, status, lastSyncedAt, lastError, updatedAt: new Date() };
  const [row] = await getDb().insert(schema.organizationRuntimeState).values(values).onConflictDoUpdate({
    target: [schema.organizationRuntimeState.logtoOrganizationId, schema.organizationRuntimeState.capability, schema.organizationRuntimeState.stateKey],
    set: { stateValue: normalizedStateValue, metadata, source, status, lastSyncedAt, lastError, updatedAt: new Date() },
  }).returning();
  return normalizeRow(row);
}

async function listRuntimeState({ logtoOrganizationId, capability } = {}) {
  if (!logtoOrganizationId || typeof logtoOrganizationId !== "string") throw new RuntimeStateError("RUNTIME_STATE_INVALID_ORGANIZATION", "logtoOrganizationId is required", { logtoOrganizationId });
  if (capability) assertValidCapability(capability);
  const where = [orm().eq(schema.organizationRuntimeState.logtoOrganizationId, logtoOrganizationId)];
  if (capability) where.push(orm().eq(schema.organizationRuntimeState.capability, capability));
  const rows = await getDb().select().from(schema.organizationRuntimeState).where(orm().and(...where));
  return rows.map(normalizeRow);
}

async function deleteRuntimeState({ logtoOrganizationId, capability, stateKey }) {
  validateRuntimeStateInput({ logtoOrganizationId, capability, stateKey });
  const [row] = await getDb().delete(schema.organizationRuntimeState).where(orm().and(
    orm().eq(schema.organizationRuntimeState.logtoOrganizationId, logtoOrganizationId),
    orm().eq(schema.organizationRuntimeState.capability, capability),
    orm().eq(schema.organizationRuntimeState.stateKey, stateKey),
  )).returning();
  if (!row) throw new RuntimeStateNotFoundError({ logtoOrganizationId, capability, stateKey });
  return normalizeRow(row);
}

function createMemoryRuntimeStateStore(initialRows = []) {
  const rows = new Map();
  const keyOf = ({ logtoOrganizationId, capability, stateKey }) => `${logtoOrganizationId}|${capability}|${stateKey}`;
  const api = {
    async getRuntimeState(input) {
      validateRuntimeStateInput(input);
      const row = rows.get(keyOf(input));
      if (!row) throw new RuntimeStateNotFoundError(input);
      return normalizeRow(row);
    },
    async setRuntimeState(input) {
      const normalizedInput = { source: "organization_runtime_state", status: "active", metadata: {}, stateValue: null, ...input };
      normalizedInput.stateValue = normalizedInput.stateValue == null ? null : String(normalizedInput.stateValue);
      validateRuntimeStateInput(normalizedInput);
      const now = new Date().toISOString();
      const key = keyOf(normalizedInput);
      const existing = rows.get(key);
      const row = { id: existing?.id || `runtime-${rows.size + 1}`, createdAt: existing?.createdAt || now, updatedAt: now, ...existing, ...normalizedInput };
      rows.set(key, row);
      return normalizeRow(row);
    },
    async listRuntimeState({ logtoOrganizationId, capability } = {}) {
      if (!logtoOrganizationId || typeof logtoOrganizationId !== "string") throw new RuntimeStateError("RUNTIME_STATE_INVALID_ORGANIZATION", "logtoOrganizationId is required", { logtoOrganizationId });
      if (capability) assertValidCapability(capability);
      return [...rows.values()].filter((row) => row.logtoOrganizationId === logtoOrganizationId && (!capability || row.capability === capability)).map(normalizeRow);
    },
    async deleteRuntimeState(input) {
      validateRuntimeStateInput(input);
      const key = keyOf(input);
      const row = rows.get(key);
      if (!row) throw new RuntimeStateNotFoundError(input);
      rows.delete(key);
      return normalizeRow(row);
    },
    size() { return rows.size; },
  };
  for (const row of initialRows) api.setRuntimeState(row);
  return api;
}

module.exports = {
  RuntimeStateError,
  RuntimeStateInvalidCapabilityError,
  RuntimeStateInvalidKeyError,
  RuntimeStateNotFoundError,
  RuntimeStateUnsafeSecretError,
  assertNoSecrets,
  assertValidCapability,
  assertValidStateKey,
  createMemoryRuntimeStateStore,
  deleteRuntimeState,
  getRuntimeState,
  listRuntimeState,
  normalizeRow,
  setRuntimeState,
  validateRuntimeStateInput,
};
