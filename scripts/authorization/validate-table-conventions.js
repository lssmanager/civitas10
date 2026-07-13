'use strict'
const { AUTHORIZATION_NAMING_CONTRACT } = require('./naming-contract')
function validateTableName(value, options = {}) {
  const c = AUTHORIZATION_NAMING_CONTRACT.tables
  if (c.prohibitedRbacTables.includes(value)) return { valid: false, category: 'violation', kind: 'table', value, expected: 'do not create local RBAC source-of-truth tables duplicating Logto' }
  if (options.localUx && !value.startsWith(c.localUxPrefix)) return { valid: false, category: 'violation', kind: 'table', value, expected: `${c.localUxPrefix}* for local UX/operational tables` }
  if (value.startsWith(c.localUxPrefix)) return { valid: true, category: 'canonical', kind: 'table', value }
  return { valid: true, category: 'external', kind: 'table', value }
}
module.exports = { validateTableName }
