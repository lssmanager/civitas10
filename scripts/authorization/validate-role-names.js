'use strict'
const { AUTHORIZATION_NAMING_CONTRACT } = require('./naming-contract')
function validateRoleName(value) {
  const c = AUTHORIZATION_NAMING_CONTRACT.roles
  if (c.global.allowed.includes(value)) return { valid: true, category: 'canonical', kind: 'role' }
  if (c.organization.allowed.includes(value) && c.organization.pattern.test(value)) return { valid: true, category: 'canonical', kind: 'role' }
  let expected = `one of global roles or organization role matching ${c.organization.requiredPrefix}*`
  if (value.startsWith(c.organization.prohibitedPrefix)) expected = `use ${c.organization.requiredPrefix}*, not ${c.organization.prohibitedPrefix}*`
  return { valid: false, category: 'violation', kind: 'role', value, expected }
}
module.exports = { validateRoleName }
