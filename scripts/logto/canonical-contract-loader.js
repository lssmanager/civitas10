'use strict'
const crypto = require('crypto')
const { getAuthorizationManifest } = require('../../core/authz')
const { validateAuthorizationContract } = require('../../core/authz/validation/validate-authz-contract')
const { AUTHORIZATION_NAMING_CONTRACT } = require('../authorization/naming-contract')
const { validatePermissionName, validateRolePermissionReference } = require('../authorization/validate-permission-prefixes')
const { validateRoleName } = require('../authorization/validate-role-names')
function canonicalJson(value) { if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`; if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((k)=>`${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`; return JSON.stringify(value) }
function hashContract(manifest) { return crypto.createHash('sha256').update(canonicalJson(manifest)).digest('hex') }
function loadCanonicalAuthorizationContract() {
  const manifest = getAuthorizationManifest()
  const validation = validateAuthorizationContract(manifest)
  const errors = [...validation.errors]
  const catalogByName = new Map(manifest.permissions.map((permission) => [permission.name, permission]))
  for (const role of [...manifest.globalRoles, ...manifest.organizationRoles]) { const result = validateRoleName(role); if (!result.valid) errors.push(`invalid role name: ${role}`) }
  for (const permission of manifest.permissions) { const result = validatePermissionName(permission.name, { allowUnknownAction: true }); if (!result.valid) errors.push(`invalid permission name: ${permission.name}: ${result.expected}`) }
  for (const [role, permissions] of Object.entries(manifest.rolePermissionAssignments)) for (const permission of permissions) { const result = validateRolePermissionReference(role, permission, catalogByName); if (!result.valid) errors.push(`invalid role permission reference ${role} -> ${permission}: ${result.expected}`) }
  return Object.freeze({ warning: 'DO NOT EDIT — generated from #74 canonical authorization registry', manifest, namingContract: AUTHORIZATION_NAMING_CONTRACT, contractHash: hashContract(manifest), errors })
}
module.exports = { canonicalJson, hashContract, loadCanonicalAuthorizationContract }
