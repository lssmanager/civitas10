'use strict'
async function applyGlobalRoleOperation(client, operation) { if (operation.type === 'create-global-role') return client.requestJson('POST', '/api/roles', { body: { name: operation.payload.name, description: `Civitas ${operation.payload.name}` } }); if (operation.type === 'assign-global-role-permissions') return client.requestJson('POST', `/api/roles/${encodeURIComponent(operation.payload.id)}/scopes`, { body: { scopeNames: operation.payload.add } }); return null }
module.exports = { applyGlobalRoleOperation }
