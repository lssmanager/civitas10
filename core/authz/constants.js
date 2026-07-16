'use strict'

const CONTRACT_VERSION = '2026-07-civitas-authz-contract-v1'
const API_RESOURCE = 'https://civitas.didaxus.com/api'
const GLOBAL_ROLES = Object.freeze(['owner_global'])
const ORGANIZATION_ROLES = Object.freeze([
  'organization_admin','organization_director','organization_headdirector','organization_headteacher','organization_groupleader','organization_teacher','organization_student','organization_parent','organization_secretary','organization_accountant','organization_billing','organization_payroll','organization_member',
])
const KNOWN_DOMAINS = Object.freeze(['owner','org','lms','billing','connectors','support','scheduling','analytics','crm','marketing','community','notifications','communications'])
module.exports = { CONTRACT_VERSION, API_RESOURCE, GLOBAL_ROLES, ORGANIZATION_ROLES, KNOWN_DOMAINS }
