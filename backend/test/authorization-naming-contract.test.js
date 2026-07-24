'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { AUTHORIZATION_NAMING_CONTRACT } = require('../../scripts/authorization/naming-contract')
const { validateRoleName } = require('../../scripts/authorization/validate-role-names')
const { validatePermissionName, validateRolePermissionReference } = require('../../scripts/authorization/validate-permission-prefixes')
const { validateTokenClaimName } = require('../../scripts/authorization/validate-token-claims')
const { validateRouteConvention } = require('../../scripts/authorization/validate-route-conventions')
const { validateTableName } = require('../../scripts/authorization/validate-table-conventions')
const { scanRepository, validateAllowlist } = require('../../scripts/authorization/scan-authorization-names')
const { getAuthorizationManifest } = require('../../core/authz')

test('naming contract centralizes canonical prefixes and resource', () => {
  assert.equal(AUTHORIZATION_NAMING_CONTRACT.resource, 'https://civitas.didaxus.com/api')
  assert.equal(AUTHORIZATION_NAMING_CONTRACT.claims.organizationId, 'organization_id')
  assert.equal(AUTHORIZATION_NAMING_CONTRACT.routes.organizationPrefix, '/o/:organizationId')
  assert.equal(AUTHORIZATION_NAMING_CONTRACT.roles.organization.requiredPrefix, 'organization_')
  assert.equal(AUTHORIZATION_NAMING_CONTRACT.permissions.tenantCore.requiredPrefix, 'org.')
})

test('role validator accepts canonical roles and rejects prohibited variants', () => {
  for (const role of ['owner_global', 'organization_admin', 'organization_headdirector']) assert.equal(validateRoleName(role).valid, true, role)
  for (const role of ['org_admin', 'organization-admin', 'organization.admin', 'organization_', 'organization__admin']) assert.equal(validateRoleName(role).valid, false, role)
})

test('permission validator accepts canonical syntax and rejects legacy/generic/wildcards', () => {
  for (const permission of ['org.members.read', 'org.members.roles.assign', 'lms.grades.read', 'lms.grades.manage', 'owner.organizations.read', 'owner.audit.logs.read']) assert.equal(validatePermissionName(permission).valid, true, permission)
  for (const permission of ['organization.members.write', 'org.*', 'lms.*', 'owner:read', 'members:read', 'read', 'write', 'org.impersonate', 'billing.seats.request_modify']) assert.equal(validatePermissionName(permission).valid, false, permission)
})

test('claim, route, and table validators enforce #88/#78/#93 conventions', () => {
  assert.equal(validateTokenClaimName('organization_id').valid, true)
  assert.equal(validateTokenClaimName('org_id').valid, false)
  assert.equal(validateTokenClaimName('organizationId', { allowLegacyRead: true }).valid, true)
  assert.equal(validateTokenClaimName('organizationId').valid, false)
  assert.equal(validateRouteConvention('/o/:organizationId/members').valid, true)
  assert.equal(validateRouteConvention('/owner/organizations/:organizationId').valid, true)
  assert.equal(validateRouteConvention('/organization/:id/members').valid, false)
  assert.equal(validateRouteConvention('/org/:organizationId/members').valid, false)
  assert.equal(validateTableName('org_ui_preferences', { localUx: true }).valid, true)
  assert.equal(validateTableName('org_roles', { localUx: true }).valid, false)
})

test('allowlist is exact, owned, dated, and rejects expired or malformed exceptions', () => {
  assert.deepEqual(validateAllowlist(new Date('2026-07-12T00:00:00Z')), [])
  assert.ok(validateAllowlist(new Date('2027-01-01T00:00:00Z'), [{ kind: 'permission', legacyValue: 'owner:read', canonicalReplacement: 'owner.profile.read', owner: 'auth', reason: 'legacy', removeAfter: '2026-12-31', allowedFiles: ['core/shared/civitas-shared.contract.cjs'] }]).some((e) => e.includes('expired')))
  assert.ok(validateAllowlist(new Date('2026-07-12T00:00:00Z'), [{ kind: 'permission', legacyValue: 'owner:read', canonicalReplacement: 'owner.profile.read', reason: 'legacy', removeAfter: '2026-12-31', allowedFiles: ['core/shared/civitas-shared.contract.cjs'] }]).some((e) => e.includes('missing owner')))
  assert.ok(validateAllowlist(new Date('2026-07-12T00:00:00Z'), [{ kind: 'permission', legacyValue: 'owner:read', canonicalReplacement: 'owner.profile.read', owner: 'auth', reason: 'legacy', allowedFiles: ['core/shared/civitas-shared.contract.cjs'] }]).some((e) => e.includes('missing removeAfter')))
  assert.ok(validateAllowlist(new Date('2026-07-12T00:00:00Z'), [{ kind: 'permission', legacyValue: 'owner:read', canonicalReplacement: 'owner.profile.read', owner: 'auth', reason: 'legacy', removeAfter: '2026-12-31', allowedFiles: ['backend/**'] }]).some((e) => e.includes('glob')))
})

test('scanner classifies exact allowlist usage and rejects same legacy outside allowed files', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'authz-naming-'))
  fs.mkdirSync(path.join(root, 'core/shared'), { recursive: true })
  fs.mkdirSync(path.join(root, 'backend/other'), { recursive: true })
  fs.writeFileSync(path.join(root, 'core/shared/civitas-shared.contract.cjs'), 'const s = "owner:read"\n')
  fs.writeFileSync(path.join(root, 'backend/other/new.js'), 'const s = "owner:read"\n')
  const report = scanRepository({ root, files: ['core/shared/civitas-shared.contract.cjs', 'backend/other/new.js'], now: new Date('2026-07-12T00:00:00Z') })
  assert.ok(report.records.some((r) => r.file === 'core/shared/civitas-shared.contract.cjs' && r.category === 'legacy'))
  assert.ok(report.records.some((r) => r.file === 'backend/other/new.js' && r.category === 'violation'))
})

test('documentation scanner tolerates prohibited examples but fails normative contradictions', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'authz-docs-'))
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true })
  fs.writeFileSync(path.join(root, 'docs/bad.md'), 'Normative: use `organization.members.write` for new tenant permissions.\n')
  fs.writeFileSync(path.join(root, 'docs/prohibited.md'), '## Formas prohibidas\n`organization.members.write`\n')
  fs.writeFileSync(path.join(root, 'docs/archived.md'), 'Archived note: `organization.members.write`\n')
  const report = scanRepository({ root, files: ['docs/bad.md', 'docs/prohibited.md', 'docs/archived.md'], now: new Date('2026-07-12T00:00:00Z') })
  assert.ok(report.summary.violations.some((r) => r.file === 'docs/bad.md'))
  assert.equal(report.summary.violations.some((r) => r.file === 'docs/prohibited.md'), false)
  assert.equal(report.summary.violations.some((r) => r.file === 'docs/archived.md'), false)
})

test('#74 registry integrates with naming without treating planned/deprecated as active', () => {
  const manifest = getAuthorizationManifest()
  const catalogByName = new Map(manifest.permissions.map((p) => [p.name, p]))
  assert.equal(validateRolePermissionReference('organization_admin', 'org.documents.read', catalogByName).valid, true)
  assert.equal(validateRolePermissionReference('organization_admin', 'billing.seat_change_requests.read', catalogByName).valid, false)
  assert.equal(validateRolePermissionReference('organization_admin', 'org.unknown.read', catalogByName).valid, false)
  const repoRoot = path.resolve(__dirname, '../..')
  const first = scanRepository({ root: repoRoot, files: ['core/authz/index.js'], now: new Date('2026-07-12T00:00:00Z') })
  const second = scanRepository({ root: repoRoot, files: ['core/authz/index.js'], now: new Date('2026-07-12T00:00:00Z') })
  assert.deepEqual(first.records, second.records)
})

test('Module UI organizationId naming exemption is limited to explicit public fixtures', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'authz-module-ui-naming-'))
  fs.mkdirSync(path.join(root, 'frontend/src/module-ui/testing'), { recursive: true })
  fs.mkdirSync(path.join(root, 'frontend/src/module-ui/registry'), { recursive: true })
  fs.writeFileSync(path.join(root, 'frontend/src/module-ui/testing/fakeRemoteUiContribution.ts'), 'export const fixture = { organizationId: "org-A" }\n')
  fs.writeFileSync(path.join(root, 'frontend/src/module-ui/registry/production.ts'), 'export const unsafe = { organizationId: "org-A" }\n')
  const report = scanRepository({ root, files: ['frontend/src/module-ui/testing/fakeRemoteUiContribution.ts', 'frontend/src/module-ui/registry/production.ts'], now: new Date('2026-07-12T00:00:00Z') })
  assert.equal(report.records.some((r) => r.file === 'frontend/src/module-ui/testing/fakeRemoteUiContribution.ts' && r.category === 'violation'), false)
  assert.ok(report.records.some((r) => r.file === 'frontend/src/module-ui/registry/production.ts' && r.value === 'organizationId' && r.category === 'violation'))
})
