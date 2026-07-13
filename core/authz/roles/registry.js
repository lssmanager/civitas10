'use strict'
const { GLOBAL_ROLES, ORGANIZATION_ROLES } = require('../constants')
const globalRolePermissionsMap = require('./global-role-permissions')
const organizationRolePermissionsMap = require('./organization-role-permissions')
const rolePermissionAssignments = Object.freeze(Object.fromEntries([...Object.entries(globalRolePermissionsMap), ...Object.entries(organizationRolePermissionsMap)].sort(([a],[b])=>a.localeCompare(b)).map(([r,p])=>[r,Object.freeze([...p].sort())])))
module.exports = { globalRoles: GLOBAL_ROLES, organizationRoles: ORGANIZATION_ROLES, globalRolePermissions: globalRolePermissionsMap, organizationRolePermissions: organizationRolePermissionsMap, rolePermissionAssignments }
