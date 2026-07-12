'use strict'
const { redact } = require('./redaction')
class LogtoBootstrapError extends Error { constructor(message, { code = 'LOGTO_BOOTSTRAP_ERROR', status, retryable = false, details } = {}) { super(message); this.name = 'LogtoBootstrapError'; this.code = code; this.status = status; this.retryable = retryable; this.details = redact(details) } }
class LogtoBootstrapConfigError extends LogtoBootstrapError { constructor(message, details) { super(message, { code: 'LOGTO_BOOTSTRAP_CONFIG_ERROR', status: 400, retryable: false, details }) } }
class LogtoBootstrapPlanError extends LogtoBootstrapError { constructor(message, details) { super(message, { code: 'LOGTO_BOOTSTRAP_PLAN_ERROR', status: 409, retryable: false, details }) } }
function classifyHttpError(status) { if (status === 429 || status === 408 || [500, 502, 503, 504].includes(status)) return { retryable: true }; return { retryable: false } }
module.exports = { LogtoBootstrapError, LogtoBootstrapConfigError, LogtoBootstrapPlanError, classifyHttpError }
