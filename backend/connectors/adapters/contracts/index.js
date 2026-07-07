// backend/connectors/adapters/contracts/index.js
// ÚNICA FUENTE DE VERDAD para contratos de adapter y lista de capabilities
// Todos los demás archivos importan de aquí — nunca duplicar

'use strict'

// ── Lista canónica de capabilities ────────────────────────────────────────
// Agregar aquí cuando se crea una nueva capability
// El registry rechaza cualquier capability que no esté en esta lista
const VALID_CAPABILITIES = [
  'identity',
  'lms',
  'crm',
  'marketing',
  'support',
  'scheduling',
  'payments',
  'email',
  'storage',
  'analytics',
  'notifications',
  'automation',
  'community',
]

// ── Estados de health ──────────────────────────────────────────────────────
// Únicos valores válidos — nunca inventar nuevos
const HealthStatus = {
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  UNHEALTHY: 'UNHEALTHY',
}

// ── Contrato mínimo de todo adapter ───────────────────────────────────────
// Un adapter que no tenga estos métodos/propiedades es rechazado por el registry
const REQUIRED_ADAPTER_FIELDS = [
  'capability',
  'provider',
  'ping',
]

// Métodos opcionales que el registry expone si existen
const OPTIONAL_ADAPTER_FIELDS = [
  'getOperationalState',
  'listActions',
]

// ── Schema de AdapterHealth ────────────────────────────────────────────────
// Lo que ping() DEBE retornar — sin excepción
// {
//   status:               'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'  (requerido)
//   latency_ms:           number                                  (requerido)
//   last_successful_ping: Date | null                             (requerido)
//   error?:               string                                  (opcional)
//   rate_limit_remaining?: number                                  (opcional)
//   pending_events?:       number                                  (opcional)
//   backoff_hint_ms?:      number                                  (opcional)
// }

// ── Validación ────────────────────────────────────────────────────────────
function validateAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object') {
    throw new ConnectorContractViolationError('unknown', ['adapter must be an object'])
  }

  const missing = REQUIRED_ADAPTER_FIELDS.filter(field => {
    if (field === 'ping') return typeof adapter[field] !== 'function'
    return typeof adapter[field] === 'undefined' || adapter[field] === null
  })

  if (missing.length > 0) {
    throw new ConnectorContractViolationError(
      adapter.capability ?? 'unknown',
      missing
    )
  }

  if (!VALID_CAPABILITIES.includes(adapter.capability)) {
    throw new ConnectorCapabilityUnsupportedError(adapter.capability)
  }

  return adapter
}

function validateAdapterContract(adapter, options = {}) {
  if (options.capability && adapter && adapter.capability !== options.capability) {
    throw new ConnectorContractViolationError(adapter.capability ?? 'unknown', ['capability'])
  }
  return validateAdapter(adapter)
}

function validateAdapterHealth(health) {
  if (!health || typeof health !== 'object' || Array.isArray(health)) {
    throw new ConnectorContractViolationError('unknown', ['health must be an object'])
  }
  const required = ['status', 'latency_ms', 'last_successful_ping']
  const missing = required.filter(field => typeof health[field] === 'undefined')
  if (missing.length > 0) throw new ConnectorContractViolationError('health', missing)
  if (!Object.values(HealthStatus).includes(health.status)) {
    throw new ConnectorContractViolationError('health', ['status'])
  }
  if (!Number.isFinite(Number(health.latency_ms))) {
    throw new ConnectorContractViolationError('health', ['latency_ms'])
  }
  if (health.last_successful_ping !== null && Number.isNaN(Date.parse(health.last_successful_ping))) {
    throw new ConnectorContractViolationError('health', ['last_successful_ping'])
  }
  return health
}

function createAdapterHealth({
  status = HealthStatus.HEALTHY,
  latency_ms,
  latencyMs,
  last_successful_ping,
  lastSuccessfulPing,
  error,
  rate_limit_remaining,
  pending_events,
  backoff_hint_ms,
} = {}) {
  const canonicalStatus = String(status).toUpperCase()
  const health = {
    status: canonicalStatus,
    latency_ms: Number(latency_ms ?? latencyMs ?? 0),
    last_successful_ping: last_successful_ping ?? lastSuccessfulPing ?? null,
  }
  if (error) health.error = String(error)
  if (rate_limit_remaining !== undefined) health.rate_limit_remaining = Number(rate_limit_remaining)
  if (pending_events !== undefined) health.pending_events = Number(pending_events)
  if (backoff_hint_ms !== undefined) health.backoff_hint_ms = Number(backoff_hint_ms)
  return validateAdapterHealth(health)
}

function isSupportedCapability(capability) {
  return VALID_CAPABILITIES.includes(capability)
}

// ── Errores tipados ────────────────────────────────────────────────────────
class ConnectorContractViolationError extends Error {
  constructor(capability, missingFields) {
    super(
      `Adapter para '${capability}' no cumple el contrato. ` +
      `Faltan: ${missingFields.join(', ')}`
    )
    this.name = 'ConnectorContractViolationError'
    this.capability = capability
    this.missingFields = missingFields
  }
}

class ConnectorCapabilityUnsupportedError extends Error {
  constructor(capability) {
    super(
      `Capability '${capability}' no está en VALID_CAPABILITIES. ` +
      `Capacidades válidas: ${VALID_CAPABILITIES.join(', ')}`
    )
    this.name = 'ConnectorCapabilityUnsupportedError'
    this.capability = capability
  }
}

class ConnectorNotConfiguredError extends Error {
  constructor(capability, org_id) {
    super(`Org ${org_id} no tiene conector activo para: ${capability}`)
    this.name = 'ConnectorNotConfiguredError'
    this.capability = capability
    this.org_id = org_id
  }
}

class ConnectorAdapterNotFoundError extends Error {
  constructor(capability, provider) {
    super(`Provider '${provider}' no registrado para capability '${capability}'`)
    this.name = 'ConnectorAdapterNotFoundError'
    this.capability = capability
    this.provider = provider
  }
}

module.exports = {
  VALID_CAPABILITIES,
  HealthStatus,
  REQUIRED_ADAPTER_FIELDS,
  OPTIONAL_ADAPTER_FIELDS,
  validateAdapter,
  validateAdapterContract,
  validateAdapterHealth,
  createAdapterHealth,
  isSupportedCapability,
  ConnectorContractViolationError,
  ConnectorCapabilityUnsupportedError,
  ConnectorNotConfiguredError,
  ConnectorAdapterNotFoundError,
}
