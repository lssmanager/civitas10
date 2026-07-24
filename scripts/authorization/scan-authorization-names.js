'use strict'
const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')
const { AUTHORIZATION_NAMING_ALLOWLIST } = require('./naming-allowlist')
const { validateRoleName } = require('./validate-role-names')
const { validatePermissionName } = require('./validate-permission-prefixes')
const { validateTokenClaimName } = require('./validate-token-claims')
const { validateRouteConvention } = require('./validate-route-conventions')
const { validateTableName } = require('./validate-table-conventions')

const DEFAULT_EXCLUDES = [/^node_modules\//, /^frontend\/node_modules\//, /^dist\//, /^coverage\//, /^artifacts\//, /^\.git\//, /^\.github\/(?!workflows\/eslint\.yml$)/, /^backend\/db\/migrations\//, /^scripts\/authorization\/naming-allowlist\.js$/, /^backend\/test\/authorization-naming-contract\.test\.js$/]
const TEXT_EXTENSIONS = new Set(['.js','.cjs','.mjs','.ts','.tsx','.json','.md','.sql','.yml','.yaml','.env','.example'])
const STRING_PATTERN = /[\"'`]([^\"'`]+)[\"'`]/g
const ROLE_PATTERN = /(?<![A-Za-z0-9_])(?:owner_global|organization_[A-Za-z0-9_-]+|org_[A-Za-z0-9_-]+|organization[-.][A-Za-z0-9_-]+|Organization_[A-Za-z0-9_-]+)(?![A-Za-z0-9_])/g
const ROUTE_PATTERN = /["'`]((?:\/owner\/organizations|\/o|\/org|\/organization|\/organizations|\/:orgId)[^"'`]*)["'`]/g
const TABLE_PATTERN = /(?<![A-Za-z0-9_])(?:org_roles|organization_roles|org_permissions|organization_permissions|org_(?:role_aliases|ui_preferences|connectors))(?![A-Za-z0-9_])/g


function isRoleCandidate(value) {
  return /^(owner_global|organization_(?:admin|member|teacher|director|headdirector|headteacher|student|parent|secretary|accountant|billing|payroll)|org_(?:admin|member|teacher|director)|Organization_[A-Za-z0-9_-]+)$/.test(value)
}

function isPermissionCandidate(value) {
  if (value.includes('*') && /^(org|lms|owner|billing|organization)\./.test(value)) return true
  if (/^(owner|runtime|worker-queues|organization|impersonation|read|create|members|lms|support|scheduling|payments|audit|connectors|crm|seats|organizations|operations|billing|profile|identity|impersonate):[a-z_-]+$/.test(value)) return true
  if (/^(organization\.(?:members|settings)\.|owner\.|org\.|lms\.|billing\.|support\.|crm\.|communications\.|scheduling\.|analytics\.|connectors\.)/.test(value) && (value.includes('*') || value.split('.').length >= 3)) return true
  return false
}

function repoFiles(root = process.cwd()) {
  const out = childProcess.execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
  return out.split('\n').filter(Boolean).filter((file) => !DEFAULT_EXCLUDES.some((re) => re.test(file))).filter((file) => TEXT_EXTENSIONS.has(path.extname(file)) || file.includes('.env'))
}
const MODULE_UI_PUBLIC_ENVELOPE_ORGANIZATION_ID_FILES = new Set([
  'frontend/src/module-ui/testing/fakeRemoteUiContribution.ts',
  'frontend/src/module-ui/registry/moduleUiRegistry.contract.test.mjs',
])
function isIntegrationEventPublicContractBoundary(file, lineText) {
  // IntegrationEvent is a public envelope contract, not an authorization-token claim boundary.
  // Keep this exception narrow: only camelCase organizationId in IntegrationEvent contracts,
  // integration-event service/repository code, and explicit Module UI public-envelope fixtures.
  return /organizationId/.test(lineText) && (
    file.startsWith('contracts/integration/') ||
    file === 'backend/services/integrationEvents.js' ||
    file === 'backend/integration/integration-events-postgres.integration.test.js' ||
    MODULE_UI_PUBLIC_ENVELOPE_ORGANIZATION_ID_FILES.has(file)
  )
}
function isNegativeFixture(file, lineText) { return file.includes('contract-tests/') || file === 'core/authz/validation/validate-authz-contract.js' || file === 'docs/authorization/phase-2-authz-contract.md' || file === 'docs/authorization/naming-contract.md' || file === 'scripts/authorization/naming-contract.js' || file === 'scripts/authorization/scan-authorization-names.js' || file === 'scripts/logto/authorization-validator.js' || file === 'backend/test/logto-authz-bootstrap.test.js' || file === 'backend/test/foundation-authorization-middleware.test.js' || file === 'backend/test/authz-scope-delegation-contract.test.js' || file === 'backend/test/authz-policy-contract.test.js' || lineText.includes('negative fixture') || lineText.includes('formas prohibidas') || lineText.includes('Formas prohibidas') || lineText.includes('Debe rechazar') || /^Archived note:/i.test(lineText) }
function allowlistEntry(kind, value, file) {
  return AUTHORIZATION_NAMING_ALLOWLIST.find((entry) => entry.kind === kind && entry.legacyValue === value && entry.allowedFiles.includes(file)) || null
}
function validateAllowlist(now = new Date(), entries = AUTHORIZATION_NAMING_ALLOWLIST) {
  const errors = []
  for (const entry of entries) {
    if (!entry.owner) errors.push(`allowlist ${entry.kind}:${entry.legacyValue} missing owner`)
    if (!entry.removeAfter) errors.push(`allowlist ${entry.kind}:${entry.legacyValue} missing removeAfter`)
    if (!Array.isArray(entry.allowedFiles) || entry.allowedFiles.length === 0) errors.push(`allowlist ${entry.kind}:${entry.legacyValue} missing allowedFiles`)
    if (entry.allowedFiles?.some((file) => file.includes('*'))) errors.push(`allowlist ${entry.kind}:${entry.legacyValue} uses glob-like allowedFiles`)
    if (!entry.canonicalReplacement && !entry.reason) errors.push(`allowlist ${entry.kind}:${entry.legacyValue} without replacement requires reason`)
    if (entry.removeAfter && new Date(`${entry.removeAfter}T23:59:59Z`) < now) errors.push(`allowlist ${entry.kind}:${entry.legacyValue} expired on ${entry.removeAfter}`)
  }
  return errors
}
function classify(kind, value, file, line, lineText, result) {
  if (isNegativeFixture(file, lineText)) return { file, line, value, kind, category: 'false-positive', severity: 'info', expected: result.expected || null }
  if (result.valid) return { file, line, value, kind, category: result.category || 'canonical', severity: 'info', expected: result.expected || null }
  const entry = allowlistEntry(kind, value, file)
  if (entry) return { file, line, value, kind, category: entry.canonicalReplacement ? 'legacy' : 'external', severity: 'warning', expected: entry.canonicalReplacement, allowlistEntry: `${entry.kind}:${entry.legacyValue}` }
  return { file, line, value, kind, category: 'violation', severity: 'error', expected: result.expected || null }
}
function scanFile(file, root = process.cwd()) {
  const abs = path.join(root, file)
  let text
  try {
    text = fs.readFileSync(abs, 'utf8')
  } catch (err) {
    console.error(`Warning: Failed to read ${file}: ${err.message}`)
    return []
  }
  const records = []
  let documentationProhibitedBlock = false
  text.split(/\r?\n/).forEach((lineText, index) => {
    const line = index + 1
    if (/^#{1,6}\s*(Formas prohibidas|Prohibited forms)/i.test(lineText)) documentationProhibitedBlock = true
    else if (/^#{1,6}\s+/.test(lineText) && documentationProhibitedBlock) documentationProhibitedBlock = false
    const effectiveLineText = documentationProhibitedBlock ? `${lineText} Formas prohibidas` : lineText
    for (const match of lineText.matchAll(STRING_PATTERN)) {
      const value = match[1]
      if (isRoleCandidate(value)) records.push(classify('role', value, file, line, effectiveLineText, validateRoleName(value)))
      if (!isPermissionCandidate(value)) continue
      records.push(classify('permission', value, file, line, effectiveLineText, validatePermissionName(value, { allowUnknownAction: true })))
    }
    const keyRole = lineText.match(/^\s*(org_(?:admin|member|teacher|director)|organization[-.][A-Za-z0-9_-]+)\s*:/)
    if (keyRole) records.push(classify('role', keyRole[1], file, line, effectiveLineText, validateRoleName(keyRole[1])))
    if (!isIntegrationEventPublicContractBoundary(file, lineText) && (/organization_id/.test(lineText) || ((file === 'backend/middleware/auth.js' || file === 'backend/authorization/guards.js' || file === 'backend/middleware/requireOrg.js' || file.includes('connectors/') || file.startsWith('frontend/src/module-ui/')) && /organizationId|org_id/.test(lineText)))) {
      for (const claim of ['organization_id','organizationId','org_id']) if (lineText.includes(claim)) records.push(classify('claim', claim, file, line, effectiveLineText, validateTokenClaimName(claim)))
    }
    for (const match of lineText.matchAll(ROUTE_PATTERN)) records.push(classify('route', match[1], file, line, effectiveLineText, validateRouteConvention(match[1])))
    for (const match of lineText.matchAll(TABLE_PATTERN)) records.push(classify('table', match[0], file, line, effectiveLineText, validateTableName(match[0])))
  })
  return records
}
function summarize(records, allowlistErrors = []) {
  const counts = { canonical: 0, legacy: 0, 'migration-only': 0, external: 0, 'false-positive': 0, 'scan-error': 0, violation: 0 }
  for (const record of records) counts[record.category] = (counts[record.category] || 0) + 1
  const filesAffected = [...new Set(records.map((r) => r.file))].sort()
  return { counts, violations: records.filter((r) => r.category === 'violation'), allowlistErrors, expiringAllowlistEntries: [], filesAffected }
}
function scanRepository(options = {}) {
  const root = options.root || process.cwd()
  const files = options.files || repoFiles(root)
  const records = files.flatMap((file) => scanFile(file, root)).sort((a,b)=>`${a.file}:${a.line}:${a.value}`.localeCompare(`${b.file}:${b.line}:${b.value}`))
  const allowlistErrors = validateAllowlist(options.now || new Date())
  return { generatedAt: new Date(0).toISOString(), contractVersion: require('./naming-contract').AUTHORIZATION_NAMING_CONTRACT.version, records, summary: summarize(records, allowlistErrors) }
}
module.exports = { scanRepository, scanFile, validateAllowlist, repoFiles }
if (require.main === module) console.log(JSON.stringify(scanRepository(), null, 2))
