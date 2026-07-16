'use strict'
async function applyResourceOperation(client, operation) { if (operation.type === 'create-resource') return client.requestJson('POST', '/api/resources', { body: { name: 'Civitas API', indicator: operation.payload.indicator } }); return null }
module.exports = { applyResourceOperation }
