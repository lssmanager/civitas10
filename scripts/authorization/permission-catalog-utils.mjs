import crypto from 'node:crypto'
import fs from 'node:fs'

export const CATALOG_PATH = 'contracts/authorization/civitas-permission-catalog.yaml'
export const PHASE3_NAMESPACES = Object.freeze(['owner','org','lms','planning','crm','marketing','community','payments','hr','scheduling','support','analytics','reports','platform'])
export const ORGANIZATION_ROLES = Object.freeze(['organization_admin','organization_director','organization_headdirector','organization_headteacher','organization_groupleader','organization_teacher','organization_student','organization_parent','organization_secretary','organization_accountant','organization_billing','organization_payroll','organization_member'])
const ENUMS = { surface: ['owner','organization','account','public','webhook'], targetStatus: ['planned','active','deprecated','removed'], observedImplementation: ['active','declared_planned','absent','verification_required'], risk: ['standard','high','restricted','critical'], compatibility: ['none','alias','blocked','compatibility-only'] }
const PROVIDERS = /(?:moodle|matomo|mautic)/i
export function canonicalJson(value) { if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`; if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((k)=>`${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`; return JSON.stringify(value) }
export function catalogHash(catalog) { return crypto.createHash('sha256').update(canonicalJson(catalog)).digest('hex') }
export function loadCatalog(path = CATALOG_PATH) { return JSON.parse(fs.readFileSync(path, 'utf8')) }
function requireArray(errors, owner, key) { if (!Array.isArray(owner[key])) errors.push(`${key} must be an array`) }
export function validateCatalog(catalog) {
  const errors = []
  for (const key of ['contractVersion','phase3Namespaces','organizationRoles','permissions','legacyDecisions']) if (!(key in catalog)) errors.push(`missing ${key}`)
  requireArray(errors, catalog, 'phase3Namespaces'); requireArray(errors, catalog, 'organizationRoles'); requireArray(errors, catalog, 'permissions'); requireArray(errors, catalog, 'legacyDecisions')
  const namespaces = new Set(catalog.phase3Namespaces || [])
  if (PHASE3_NAMESPACES.some((ns) => !namespaces.has(ns)) || namespaces.size !== PHASE3_NAMESPACES.length) errors.push('phase3Namespaces must match the 14 Phase 3 namespaces')
  if (JSON.stringify(catalog.organizationRoles || []) !== JSON.stringify(ORGANIZATION_ROLES)) errors.push('organizationRoles must freeze the 13 Phase 3 roles')
  const seen = new Set()
  for (const permission of catalog.permissions || []) {
    const prefix = `permission ${permission.name || '<missing>'}`
    for (const key of ['name','namespace','capabilityId','surface','targetStatus','observedImplementation','dataScopeStrategy','risk','consumers','policyRequirements','screenActionIds']) if (!(key in permission)) errors.push(`${prefix} missing ${key}`)
    if (!/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)?$/.test(permission.name || '')) errors.push(`${prefix} invalid permission ID`)
    if ((permission.name || '').includes('*')) errors.push(`${prefix} contains wildcard`)
    if (PROVIDERS.test(permission.name || '')) errors.push(`${prefix} contains provider name`)
    if (seen.has(permission.name)) errors.push(`${prefix} duplicate ID`); seen.add(permission.name)
    if (!namespaces.has(permission.namespace)) errors.push(`${prefix} unknown namespace`)
    if (!(permission.name || '').startsWith(`${permission.namespace}.`)) errors.push(`${prefix} namespace mismatch`)
    for (const [key, values] of Object.entries(ENUMS)) if (permission[key] && !values.includes(permission[key])) errors.push(`${prefix} invalid ${key}`)
    for (const key of ['consumers','policyRequirements','screenActionIds']) if (!Array.isArray(permission[key])) errors.push(`${prefix} ${key} must be an array`)
    if (permission.surface === 'owner' && permission.namespace !== 'owner') errors.push(`${prefix} owner surface mismatch`)
    if (permission.namespace === 'owner' && permission.surface !== 'owner') errors.push(`${prefix} owner namespace must use owner surface`)
    if (permission.targetStatus === 'active' && (permission.observedImplementation !== 'active' || permission.consumers.length === 0 || permission.policyRequirements.length === 0 || !permission.dataScopeStrategy)) errors.push(`${prefix} active entries require active observation, consumers, policies and data scope`)
    if (permission.targetStatus === 'deprecated' && (!permission.replacement || !permission.compatibility || permission.compatibility === 'none')) errors.push(`${prefix} deprecated entries require replacement and compatibility window`)
  }
  const legacy = new Set()
  for (const decision of catalog.legacyDecisions || []) { if (legacy.has(decision.legacyId)) errors.push(`legacy ${decision.legacyId} duplicate decision`); legacy.add(decision.legacyId); if (!['rename','compatibility-only','blocked'].includes(decision.decision)) errors.push(`legacy ${decision.legacyId} invalid decision`) }
  if ((catalog.permissions || []).length !== 160) errors.push('catalog must contain exactly 160 target permissions')
  if ((catalog.legacyDecisions || []).length !== 10) errors.push('catalog must contain exactly 10 legacy decisions')
  return { valid: errors.length === 0, errors }
}
