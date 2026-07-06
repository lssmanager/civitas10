"use strict";

const VALID_CAPABILITIES = Object.freeze({
  AUTH: "auth",
  IDENTITY: "identity",
  AUTHORIZATION: "authorization",
  ORGANIZATION: "organization",
  OWNER_GLOBAL: "owner_global",
  WORKER: "worker",
  ROLE_MAPPING: "role_mapping",
  CRM: "crm",
  CRM_SYNC: "crm_sync",
  LMS: "lms",
  COMMUNITY: "community",
  PAYMENTS: "payments",
  BILLING: "billing",
  EMAIL: "email",
  NOTIFICATIONS: "notifications",
  SUPPORT: "support",
  SCHEDULING: "scheduling",
  STORAGE: "storage",
  ANALYTICS: "analytics",
  AUDIT: "audit",
  HEALTH: "health",
});

const CAPABILITIES = Object.freeze(Object.values(VALID_CAPABILITIES));
const HEALTH_STATUSES = Object.freeze({
  HEALTHY: "healthy",
  DEGRADED: "degraded",
  UNHEALTHY: "unhealthy",
});
const ADAPTER_HEALTH_STATUSES = Object.freeze({
  HEALTHY: "HEALTHY",
  DEGRADED: "DEGRADED",
  UNHEALTHY: "UNHEALTHY",
});
const LEGACY_HEALTH_STATUS_MAP = Object.freeze({
  HEALTHY: HEALTH_STATUSES.HEALTHY,
  DEGRADED: HEALTH_STATUSES.DEGRADED,
  UNHEALTHY: HEALTH_STATUSES.UNHEALTHY,
});

function contractError(message, details = {}) {
  const error = new Error(message);
  error.name = "AdapterContractError";
  error.code = "ADAPTER_CONTRACT_INVALID";
  error.details = details;
  return error;
}

function isSupportedCapability(capability) {
  return CAPABILITIES.includes(capability);
}

function normalizeHealthStatus(status) {
  const normalized = LEGACY_HEALTH_STATUS_MAP[status] || status;
  if (!Object.values(HEALTH_STATUSES).includes(normalized)) {
    throw contractError(`Invalid health status: ${status}`, { status });
  }
  return normalized;
}

/**
 * @typedef {Object} HealthStatus
 * @property {"healthy"|"degraded"|"unhealthy"} status
 * @property {number} timestamp
 * @property {Object<string, unknown>=} details
 * @property {number=} latencyMs
 * @property {string=} error
 */

function createHealthStatus({ status = HEALTH_STATUSES.HEALTHY, timestamp = Date.now(), details, latencyMs = 0, error } = {}) {
  if (!Number.isFinite(timestamp)) throw contractError("HealthStatus timestamp must be a finite number", { timestamp });
  if (latencyMs !== undefined && !Number.isFinite(Number(latencyMs))) throw contractError("HealthStatus latencyMs must be numeric", { latencyMs });
  return Object.freeze({
    status: normalizeHealthStatus(status),
    timestamp,
    ...(details && typeof details === "object" ? { details } : {}),
    ...(latencyMs !== undefined ? { latencyMs: Number(latencyMs) } : {}),
    ...(error ? { error: String(error) } : {}),
  });
}

function createAdapterHealth({ status, latency_ms, latencyMs, last_successful_ping, lastSuccessfulPing, error, rate_limit_remaining, pending_events, backoff_hint_ms, details, timestamp } = {}) {
  return createHealthStatus({
    status,
    timestamp,
    latencyMs: latencyMs ?? latency_ms ?? 0,
    error,
    details: details || {
      ...(lastSuccessfulPing || last_successful_ping ? { lastSuccessfulPing: lastSuccessfulPing || last_successful_ping } : {}),
      ...(rate_limit_remaining !== undefined ? { rateLimitRemaining: rate_limit_remaining } : {}),
      ...(pending_events !== undefined ? { pendingEvents: pending_events } : {}),
      ...(backoff_hint_ms !== undefined ? { backoffHintMs: backoff_hint_ms } : {}),
    },
  });
}

/**
 * @typedef {Object} AdapterContract
 * @property {string} name
 * @property {string} capability one of VALID_CAPABILITIES values
 * @property {string} version
 * @property {() => Promise<HealthStatus>} healthCheck
 * @property {(input: unknown) => Promise<unknown>=} execute
 * @property {() => boolean|void} validate
 */

function assertAdapterContract(adapter) {
  if (!adapter || typeof adapter !== "object") throw contractError("Adapter must be an object");
  if (typeof adapter.name !== "string" || adapter.name.trim() === "") throw contractError("Adapter name is required");
  if (!isSupportedCapability(adapter.capability)) throw contractError(`Unsupported adapter capability: ${adapter.capability}`, { capability: adapter.capability });
  if (typeof adapter.version !== "string" || adapter.version.trim() === "") throw contractError("Adapter version is required", { name: adapter.name });
  if (typeof adapter.healthCheck !== "function") throw contractError("Adapter healthCheck() is required", { name: adapter.name });
  if (adapter.execute !== undefined && typeof adapter.execute !== "function") throw contractError("Adapter execute must be a function when provided", { name: adapter.name });
  if (typeof adapter.validate !== "function") throw contractError("Adapter validate() is required", { name: adapter.name });
  const validationResult = adapter.validate();
  if (validationResult === false) throw contractError("Adapter validate() returned false", { name: adapter.name, capability: adapter.capability });
  return adapter;
}

module.exports = {
  ADAPTER_HEALTH_STATUSES,
  CAPABILITIES,
  HEALTH_STATUSES,
  VALID_CAPABILITIES,
  assertAdapterContract,
  createAdapterHealth,
  createHealthStatus,
  isSupportedCapability,
};
