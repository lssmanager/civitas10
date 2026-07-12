'use strict'
const { loadCanonicalAuthorizationContract } = require('./canonical-contract-loader')
const { LogtoBootstrapPlanError } = require('./errors')
const EXACT_REJECTIONS = ['org.impersonate', 'impersonation:write', 'billing.seats.request_modify', 'owner:read', 'owner:write', 'organization.members.write', 'read', 'write']
function validateLocalAuthorizationContract(contract = loadCanonicalAuthorizationContract()) {
  const errors = [...contract.errors]
  const { manifest } = contract
  for (const [role, permissions] of Object.entries(manifest.rolePermissionAssignments)) {
    for (const permission of permissions) {
      if (role === 'owner_global' && !permission.startsWith('owner.')) errors.push(`owner_global may only receive owner.*: ${permission}`)
      if (role.startsWith('organization_') && permission.startsWith('owner.')) errors.push(`organization role may not receive owner.*: ${role} -> ${permission}`)
      if (EXACT_REJECTIONS.includes(permission) || permission.includes('*')) errors.push(`forbidden role assignment: ${role} -> ${permission}`)
      if (role === 'owner_global' && /^(org|analytics|billing|lms)\./.test(permission)) errors.push(`owner_global forbidden non-owner candidate: ${permission}`)
    }
  }
  for (const permission of manifest.permissions) {
    if (permission.status !== 'active' && Object.values(manifest.rolePermissionAssignments).some((perms)=>perms.includes(permission.name))) errors.push(`non-active permission assigned: ${permission.name}`)
  }
  return { valid: errors.length === 0, errors, contract }
}
function assertValidLocalAuthorizationContract(contract) { const result = validateLocalAuthorizationContract(contract); if (!result.valid) throw new LogtoBootstrapPlanError('Local authorization contract failed preflight validation', { errors: result.errors }); return result }
module.exports = { EXACT_REJECTIONS, assertValidLocalAuthorizationContract, validateLocalAuthorizationContract }
