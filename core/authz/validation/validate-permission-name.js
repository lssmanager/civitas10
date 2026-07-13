'use strict'
const SEGMENT = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/
const ACTIONS = new Set(['read','write','create','update','delete','manage','assign','execute','cancel','approve','reject','invite','remove','release','configure','enroll','book','reset','deprovision','sync'])
function validatePermissionName(value, options = {}) {
  const invalid = (expected) => ({ valid: false, category: 'violation', kind: 'permission', value, expected })
  if (typeof value !== 'string' || value.length === 0) return invalid('permission must be a non-empty string')
  if (value.includes('*')) return invalid('wildcards are forbidden')
  if (value.includes(':')) return invalid('use dot-separated <domain>.<resource>.<action>, not colon scopes')
  if (value.startsWith('organization.')) return invalid('use org. for tenant core permissions; organization.* is forbidden')
  const parts = value.split('.')
  if (parts.length < 3) return invalid('permission must be <domain>.<resource>.<action>')
  if (parts.some((part) => part.length === 0)) return invalid('permission segments must not be empty')
  if (!parts.every((part) => SEGMENT.test(part))) return invalid('segments must be lowercase snake_case without spaces')
  const action = parts[parts.length - 1]
  if (!ACTIONS.has(action) && !options.allowUnknownAction) return invalid(`action must be explicit; received ${action}`)
  return { valid: true, category: 'canonical', kind: 'permission', value }
}
module.exports = { validatePermissionName }
