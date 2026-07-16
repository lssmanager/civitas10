'use strict'
async function readAuthorizationState(client, { resourceIndicator } = {}) {
  if (!client) return emptyRemoteState({ source: 'empty-no-credentials' })
  const resources = normalizeList(await client.requestJson('GET', '/api/resources'))
  const resource = resources.find((item) => item.indicator === resourceIndicator || item.identifier === resourceIndicator) || null
  const resourceId = resource?.id || null
  const permissions = resourceId ? normalizeList(await client.requestJson('GET', `/api/resources/${encodeURIComponent(resourceId)}/scopes`, { allow404: true })) : []
  const globalRoles = normalizeList(await client.requestJson('GET', '/api/roles', { allow404: true }))
  const organizationRoles = normalizeList(await client.requestJson('GET', '/api/organization-roles', { allow404: true }))
  return normalizeRemoteState({ resources, resource, permissions, globalRoles, organizationRoles })
}
function normalizeList(value) { if (!value) return []; if (Array.isArray(value)) return value; if (Array.isArray(value.data)) return value.data; if (Array.isArray(value.items)) return value.items; return [] }
function emptyRemoteState({ source = 'empty' } = {}) { return normalizeRemoteState({ source, resources: [], resource: null, permissions: [], globalRoles: [], organizationRoles: [] }) }
function normalizeRemoteState({ source = 'remote', resources = [], resource = null, permissions = [], globalRoles = [], organizationRoles = [] } = {}) {
  const normalizedPermissions = permissions.map((p) => ({ id: p.id || p.scopeId || p.name, name: p.name || p.scope || p.value, description: p.description || '', resourceId: p.resourceId || resource?.id || null })).filter((p)=>p.name).sort((a,b)=>a.name.localeCompare(b.name))
  const normalizeRole = (role, type) => ({ id: role.id || role.roleId || role.name, name: role.name, type, permissions: [...new Set((role.permissions || role.scopes || role.resourceScopes || []).map((p)=>typeof p === 'string' ? p : (p.name || p.scope)).filter(Boolean))].sort() })
  return Object.freeze({ source, resources, resource: resource ? { id: resource.id, indicator: resource.indicator || resource.identifier, name: resource.name || resource.indicator || resource.identifier } : null, permissions: normalizedPermissions, globalRoles: globalRoles.map((r)=>normalizeRole(r, 'global')).filter((r)=>r.name).sort((a,b)=>a.name.localeCompare(b.name)), organizationRoles: organizationRoles.map((r)=>normalizeRole(r, 'organization')).filter((r)=>r.name).sort((a,b)=>a.name.localeCompare(b.name)) })
}
module.exports = { emptyRemoteState, normalizeRemoteState, readAuthorizationState }
