'use strict'

const { permissionsByName } = require('../../core/authz')
const { validatePermissionName } = require('../../scripts/authorization/validate-permission-prefixes')

function normalizeScopes(req) {
  const scopes = req.auth?.scopes ?? req.user?.scopes ?? []
  if (scopes instanceof Set) return scopes
  return new Set(Array.isArray(scopes) ? scopes : [])
}

function assertKnownActivePermission(permission) {
  const syntax = validatePermissionName(permission, { allowUnknownAction: true })
  if (!syntax.valid) throw new Error(`Invalid permission guard ${permission}: ${syntax.expected}`)
  const definition = permissionsByName[permission]
  if (!definition) throw new Error(`Unknown permission guard: ${permission}`)
  if (definition.status !== 'active') throw new Error(`Permission guard must reference an active permission: ${permission}`)
  return definition
}

function buildDecisionId() { return `authz_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}` }

function requireAllPermissions(permissions) {
  if (!Array.isArray(permissions) || permissions.length === 0) throw new Error('requireAllPermissions requires at least one permission')
  permissions.forEach(assertKnownActivePermission)
  return (req, res, next) => {
    if (!req.user && !req.auth) return res.status(401).json({ error: 'Unauthorized', code: 'authentication_required' })
    const scopes = normalizeScopes(req)
    const missing = permissions.filter((permission) => !scopes.has(permission))
    if (missing.length) return res.status(403).json({ error: 'Forbidden', code: 'permission_missing', requiredPermission: missing[0], decisionId: buildDecisionId() })
    return next()
  }
}

function requireAnyPermission(permissions) {
  if (!Array.isArray(permissions) || permissions.length === 0) throw new Error('requireAnyPermission requires at least one permission')
  permissions.forEach(assertKnownActivePermission)
  return (req, res, next) => {
    if (!req.user && !req.auth) return res.status(401).json({ error: 'Unauthorized', code: 'authentication_required' })
    const scopes = normalizeScopes(req)
    if (!permissions.some((permission) => scopes.has(permission))) return res.status(403).json({ error: 'Forbidden', code: 'permission_missing_any', requiredAnyPermissions: permissions, decisionId: buildDecisionId() })
    return next()
  }
}

function requirePermission(permission) { return requireAllPermissions([permission]) }

module.exports = { assertKnownActivePermission, requireAllPermissions, requireAnyPermission, requirePermission }
