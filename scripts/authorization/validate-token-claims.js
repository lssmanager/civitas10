'use strict'
const { AUTHORIZATION_NAMING_CONTRACT } = require('./naming-contract')
function validateTokenClaimName(value, options = {}) {
  const canonical = AUTHORIZATION_NAMING_CONTRACT.claims.organizationId
  if (value === canonical) return { valid: true, category: 'canonical', kind: 'claim', value }
  if (value === 'organizationId' && options.allowLegacyRead) return { valid: true, category: 'legacy', kind: 'claim', value, expected: canonical }
  if (value === 'org_id' || value === 'organizationId') return { valid: false, category: 'violation', kind: 'claim', value, expected: canonical }
  return { valid: true, category: 'external', kind: 'claim', value }
}
module.exports = { validateTokenClaimName }
