'use strict'
const { AUTHORIZATION_NAMING_CONTRACT } = require('./naming-contract')
const SEGMENT = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/
const ACTIONS = new Set(['read','write','create','update','delete','manage','assign','execute','cancel','approve','reject','invite','remove','release','configure','enroll','book','reset','deprovision','sync'])
function validatePermissionName(value, options = {}) {
  const c = AUTHORIZATION_NAMING_CONTRACT.permissions
  const invalid = (expected) => ({ valid: false, category: 'violation', kind: 'permission', value, expected })
  if (typeof value !== 'string' || value.length === 0) return invalid('permission must be a non-empty string')
  if (value.includes('*')) return invalid('wildcards are forbidden')
  if (value.includes(':')) return invalid('use dot-separated <domain>.<resource>.<action>, not colon scopes')
  if (value.startsWith(c.tenantCore.prohibitedPrefix)) return invalid(`use ${c.tenantCore.requiredPrefix} for tenant core permissions; organization.* is forbidden`)
  if (c.prohibitedCanonical.includes(value)) return invalid(`${value} is not a canonical active permission`)
  const parts = value.split('.')
  if (parts.length < 3) return invalid('permission must be <domain>.<resource>.<action>')
  if (parts.some((part) => part.length === 0)) return invalid('permission segments must not be empty')
  if (!parts.every((part) => SEGMENT.test(part))) return invalid('segments must be lowercase snake_case without spaces')
  const action = parts[parts.length - 1]
  if (!ACTIONS.has(action) && !options.allowUnknownAction) return invalid(`action must be explicit; received ${action}`)
  return { valid: true, category: 'canonical', kind: 'permission', value }
}
function validateRolePermissionReference(role, permission, catalogByName = new Map()) {
  const syntax = validatePermissionName(permission, { allowUnknownAction: true })
  if (!syntax.valid) return syntax
  if (role === 'owner_global' && !permission.startsWith('owner.')) return { valid: false, category: 'violation', kind: 'permission-reference', value: permission, expected: 'owner_global may only reference owner.* permissions' }
  if (role && role.startsWith('organization_') && permission.startsWith('owner.')) return { valid: false, category: 'violation', kind: 'permission-reference', value: permission, expected: 'organization roles must not reference owner.* permissions' }
  if (catalogByName.size) {
    const def = catalogByName.get(permission)
    if (!def) return { valid: false, category: 'violation', kind: 'permission-reference', value: permission, expected: 'permission reference must exist in #74 catalog' }
    if (def.status !== 'active') return { valid: false, category: 'violation', kind: 'permission-reference', value: permission, expected: 'role references must target active catalog permissions' }
    if (role?.startsWith('organization_') && def.surface !== 'organization' && def.surface !== 'self') return { valid: false, category: 'violation', kind: 'permission-reference', value: permission, expected: 'organization role permissions must be organization/self surface' }
  }
  return { valid: true, category: 'canonical', kind: 'permission-reference', value: permission }
}
module.exports = { validatePermissionName, validateRolePermissionReference }
