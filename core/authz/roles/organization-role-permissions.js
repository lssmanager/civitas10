'use strict'

const { activeRoleScopes } = require('./generated/role-model')

module.exports = Object.freeze(Object.fromEntries(Object.entries(activeRoleScopes).map(([roleKey, scopes]) => [roleKey, Object.freeze([...scopes].sort())])))
