'use strict'

const { API_RESOURCE, GLOBAL_ROLES, ORGANIZATION_ROLES } = require('../../core/authz/constants')

const AUTHORIZATION_NAMING_CONTRACT = Object.freeze({
  version: '2026-07-v1',
  roles: Object.freeze({
    global: Object.freeze({ allowed: GLOBAL_ROLES }),
    organization: Object.freeze({
      allowed: ORGANIZATION_ROLES,
      requiredPrefix: 'organization_',
      pattern: /^organization_[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/,
      prohibitedPrefix: 'org_',
    }),
  }),
  permissions: Object.freeze({
    owner: Object.freeze({ requiredPrefix: 'owner.' }),
    tenantCore: Object.freeze({ requiredPrefix: 'org.', prohibitedPrefix: 'organization.' }),
    wildcardForbidden: true,
    genericPermissionsForbidden: true,
    prohibitedCanonical: Object.freeze(['org.impersonate', 'billing.seats.request_modify']),
  }),
  claims: Object.freeze({ organizationId: 'organization_id', prohibitedCanonical: Object.freeze(['org_id', 'organizationId']) }),
  routes: Object.freeze({
    organizationPrefix: '/o/:organizationId',
    ownerOrganizationPrefix: '/owner/organizations/:organizationId',
    prohibitedTenantPrefixes: Object.freeze(['/organization/:id', '/organizations/:organizationId', '/org/:organizationId', '/o/:orgId']),
  }),
  tables: Object.freeze({
    localUxPrefix: 'org_',
    prohibitedRbacTables: Object.freeze(['org_roles', 'organization_roles', 'org_permissions', 'organization_permissions']),
    boundedContextAllowed: Object.freeze(['operational_tenants', 'organization_runtime_state', 'registry_connector_bindings', 'authorization_scope_assignments']),
  }),
  resource: API_RESOURCE,
})

module.exports = { AUTHORIZATION_NAMING_CONTRACT }
