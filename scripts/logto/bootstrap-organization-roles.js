'use strict'
async function applyOrganizationRoleOperation(client, operation) { if (operation.type === 'create-organization-role') return client.requestJson('POST', '/api/organization-roles', { body: { name: operation.payload.name, description: `Civitas ${operation.payload.name}` } }); if (operation.type === 'assign-organization-role-permissions') return client.requestJson('POST', `/api/organization-roles/${encodeURIComponent(operation.payload.id)}/resource-scopes`, { body: { scopeNames: operation.payload.add } }); return null }
module.exports = { applyOrganizationRoleOperation }
