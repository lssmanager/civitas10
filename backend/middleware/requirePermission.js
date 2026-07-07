'use strict'

const { ROLE_PERMISSIONS } = require('../authorization/roles')

function requirePermission(permission) {
  return (req, res, next) => {
    const user = req.user
    if (!user) {
      return res.status(401).json({ error: 'Sin contexto de usuario' })
    }

    const userRoles = user.roles ?? []
    const userScopes = user.scopes ?? []

    const hasPermission =
      userRoles.some((role) => {
        const perms = ROLE_PERMISSIONS[role] ?? []
        return perms.includes('*') || perms.includes(permission)
      }) || userScopes.includes(permission)

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Sin permisos suficientes',
        required: permission,
        roles: userRoles,
      })
    }

    return next()
  }
}

module.exports = { requirePermission }
