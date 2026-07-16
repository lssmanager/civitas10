'use strict'
const SENSITIVE_KEY_PATTERN = /(authorization|password|secret|token|credential|cookie|client[_-]?secret|api[_-]?key)/i
function redact(value, depth = 0) {
  if (value == null) return value
  if (depth > 5) return '[MaxDepth]'
  if (value instanceof Error) return { name: value.name, message: value.message, code: value.code, status: value.status }
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1))
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : redact(entry, depth + 1)]))
  if (typeof value === 'string') return value.length > 500 ? `${value.slice(0, 500)}…` : value
  return value
}
module.exports = { SENSITIVE_KEY_PATTERN, redact }
