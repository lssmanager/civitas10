'use strict'

const { API_RESOURCE, KNOWN_DOMAINS } = require('../constants')
const modules = Object.freeze({
  analytics: require('./analytics.permissions'), billing: require('./billing.permissions'), communications: require('./communications.permissions'), community: require('./community.permissions'), connectors: require('./connectors.permissions'), crm: require('./crm.permissions'), lms: require('./lms.permissions'), marketing: require('./marketing.permissions'), notifications: require('./notifications.permissions'), org: require('./organization.permissions'), owner: require('./owner.permissions'), scheduling: require('./scheduling.permissions'), support: require('./support.permissions'),
})
const permissions = Object.freeze(Object.values(modules).flat().sort((a,b)=>a.name.localeCompare(b.name)).map(Object.freeze))
const permissionsByName = Object.freeze(Object.fromEntries(permissions.map((p)=>[p.name,p])))
module.exports = { API_RESOURCE, knownDomains: KNOWN_DOMAINS, modules, permissions, permissionsByName }
