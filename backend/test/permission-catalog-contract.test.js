'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const generated = require('../../core/authz/catalog/generated/permission-catalog')

test('canonical permission catalog exposes Phase 3 scope without activating planned entries', () => {
  assert.equal(generated.permissions.length, 160)
  assert.equal(generated.catalog.legacyDecisions.length, 10)
  assert.deepEqual(generated.catalog.phase3Namespaces, ['owner','org','lms','planning','crm','marketing','community','payments','hr','scheduling','support','analytics','reports','platform'])
  assert.ok(generated.catalog.organizationRoles.includes('organization_groupleader'))
  assert.deepEqual(generated.activePermissions.map((permission) => permission.name).sort(), ['lms.course_offerings.read','lms.group_members.read','lms.groups.read','org.documents.create','org.documents.read'])
})

test('generated catalog hash is committed with inventory and runtime artifacts', () => {
  const inventory = require('../../artifacts/authorization/permission-catalog.json')
  assert.equal(inventory.catalogHash, generated.catalogHash)
  assert.equal(generated.permissionsByName['org.documents.read'].observedImplementation, 'active')
  assert.equal(generated.permissionsByName['owner.audit.update'].observedImplementation, 'verification_required')
})
