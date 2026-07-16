'use strict'
const { AUTHORIZATION_NAMING_CONTRACT } = require('./naming-contract')
function normalizeRoute(route) { return String(route).replace(/\/\*$/, '').replace(/\/$/, '') }
function validateRouteConvention(route, options = {}) {
  const c = AUTHORIZATION_NAMING_CONTRACT.routes
  const value = normalizeRoute(route)
  if (value === c.organizationPrefix || value.startsWith(`${c.organizationPrefix}/`)) return { valid: true, category: 'canonical', kind: 'route', value: route }
  if (value === c.ownerOrganizationPrefix || value.startsWith(`${c.ownerOrganizationPrefix}/`)) return { valid: true, category: 'canonical', kind: 'route', value: route }
  if (options.migrationRedirect && options.redirectTarget && normalizeRoute(options.redirectTarget).startsWith(c.organizationPrefix)) return { valid: true, category: 'migration-only', kind: 'route', value: route, expected: c.organizationPrefix }
  for (const prefix of c.prohibitedTenantPrefixes) {
    if (value === prefix || value.startsWith(`${prefix}/`)) return { valid: false, category: 'violation', kind: 'route', value: route, expected: c.organizationPrefix }
  }
  return { valid: true, category: 'external', kind: 'route', value: route }
}
module.exports = { validateRouteConvention }
