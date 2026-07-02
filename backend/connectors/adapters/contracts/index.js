"use strict";

const HealthStatus = Object.freeze({ HEALTHY: "HEALTHY", DEGRADED: "DEGRADED", UNHEALTHY: "UNHEALTHY" });
const VALID_CAPABILITIES = Object.freeze(["identity", "crm", "marketing", "lms", "community", "support", "scheduling", "payments", "automation"]);
const AdapterContract = Object.freeze({
  requiredMethods: Object.freeze(["ping"]),
  optionalMethods: Object.freeze(["getOperationalState", "createOrganization", "getOrganization", "deleteOrganization", "updateOrganizationCustomData", "createUser", "getUserByEmail", "addMemberToOrganization", "removeMemberFromOrganization", "getOrganizationMembers", "assignRole", "sendInvitation"]),
});
const AdapterHealthSchema = Object.freeze({ required: Object.freeze(["status", "latency_ms", "message", "checked_at"]) });
class ConnectorContractViolationError extends Error {
  constructor(message, details = {}) { super(message); this.name = "ConnectorContractViolationError"; this.code = "CONNECTOR_CONTRACT_VIOLATION"; this.details = details; }
}
function validateHealthStatus(status) {
  if (!Object.values(HealthStatus).includes(status)) throw new ConnectorContractViolationError(`Invalid adapter health status: ${status}`, { status });
  return status;
}
function validateAdapterHealth(health) {
  if (!health || typeof health !== "object" || Array.isArray(health)) throw new ConnectorContractViolationError("Adapter health must be an object");
  for (const key of AdapterHealthSchema.required) if (!(key in health)) throw new ConnectorContractViolationError(`Adapter health is missing ${key}`, { key });
  validateHealthStatus(health.status);
  if (health.latency_ms !== null && !Number.isFinite(Number(health.latency_ms))) throw new ConnectorContractViolationError("Adapter health latency_ms must be a number or null", { latency_ms: health.latency_ms });
  if (health.message !== null && typeof health.message !== "string") throw new ConnectorContractViolationError("Adapter health message must be a string or null");
  if (typeof health.checked_at !== "string" || Number.isNaN(Date.parse(health.checked_at))) throw new ConnectorContractViolationError("Adapter health checked_at must be an ISO timestamp", { checked_at: health.checked_at });
  return health;
}
function validateAdapterContract(adapter, options = {}) {
  const capability = options.capability || adapter?.capability;
  if (!VALID_CAPABILITIES.includes(capability)) throw new ConnectorContractViolationError(`Invalid connector capability: ${capability}`, { capability });
  if (!adapter || typeof adapter !== "object") throw new ConnectorContractViolationError("Adapter must be an object", { capability });
  for (const method of AdapterContract.requiredMethods) if (typeof adapter[method] !== "function") throw new ConnectorContractViolationError(`Adapter for ${capability} is missing required method ${method}()`, { capability, method });
  for (const method of AdapterContract.optionalMethods) if (adapter[method] !== undefined && typeof adapter[method] !== "function") throw new ConnectorContractViolationError(`Adapter optional method ${method} must be a function`, { capability, method });
  return adapter;
}
module.exports = { AdapterContract, AdapterHealthSchema, ConnectorContractViolationError, HealthStatus, VALID_CAPABILITIES, validateAdapterContract, validateAdapterHealth, validateHealthStatus };
