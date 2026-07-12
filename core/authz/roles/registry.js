'use strict'
const { GLOBAL_ROLES, ORGANIZATION_ROLES } = require('../constants')
const globalRoles = require('./global-role-permissions')
const organizationRoles = require('./organization-role-permissions')
const rolePermissionAssignments = Object.freeze(Object.fromEntries([...Object.entries(globalRoles), ...Object.entries(organizationRoles)].sort(([a],[b])=>a.localeCompare(b)).map(([r,p])=>[r,Object.freeze([...p].sort())])))
module.exports = { globalRoles: GLOBAL_ROLES, organizationRoles: ORGANIZATION_ROLES, globalRolePermissions: globalRoles, organizationRolePermissions: organizationRoles, rolePermissionAssignments }
