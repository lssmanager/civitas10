'use strict'
const { CONTRACT_VERSION, API_RESOURCE } = require('./constants')
const catalog = require('./catalog/registry')
const roles = require('./roles/registry')
function getAuthorizationManifest() {
  return Object.freeze({ contractVersion: CONTRACT_VERSION, resource: API_RESOURCE, permissions: catalog.permissions, globalRoles: roles.globalRoles, organizationRoles: roles.organizationRoles, rolePermissionAssignments: roles.rolePermissionAssignments })
}
module.exports = { ...catalog, ...roles, contractVersion: CONTRACT_VERSION, resource: API_RESOURCE, getAuthorizationManifest }
