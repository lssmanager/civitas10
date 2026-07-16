'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { OWNER_PERMISSIONS, ORGANIZATION_PERMISSIONS, API_RESOURCE } = require('../../core/authz/runtime/active-permissions')
const { permissionsByName, rolePermissionAssignments } = require('../../core/authz')

test('runtime permission adapter exposes only active canonical API permissions', () => {
  for (const permission of [...Object.values(OWNER_PERMISSIONS), ...Object.values(ORGANIZATION_PERMISSIONS)]) {
    assert.equal(permission.includes(':'), false, permission)
    assert.equal(permission.includes('*'), false, permission)
    const definition = permissionsByName[permission]
    assert.ok(definition, permission)
    assert.equal(definition.status, 'active', permission)
    assert.equal(definition.resource, API_RESOURCE, permission)
  }
})

test('legacy scopes are absent from shared contract, frontend, and runtime backend imports', () => {
  const root = path.resolve(__dirname, '../..')
  const shared = fs.readFileSync(path.join(root, 'core/shared/civitas-shared.contract.cjs'), 'utf8')
  const ownerScopes = fs.readFileSync(path.join(root, 'frontend/src/authz/ownerScopes.ts'), 'utf8')
  const requirePermission = fs.readFileSync(path.join(root, 'backend/middleware/requirePermission.js'), 'utf8')
  assert.equal(shared.includes('owner:read'), false) // negative fixture
  assert.equal(ownerScopes.includes('worker-queues:read'), false) // negative fixture
  assert.equal(requirePermission.includes('scripts/authorization'), false)
})

test('Logto role assignments stay inside active canonical role surfaces', () => {
  assert.deepEqual(rolePermissionAssignments.owner_global, Object.values(OWNER_PERMISSIONS).sort())
  for (const permission of rolePermissionAssignments.owner_global) assert.equal(permission.startsWith('owner.'), true, permission)
  for (const [role, permissions] of Object.entries(rolePermissionAssignments)) {
    if (role.startsWith('organization_')) {
      for (const permission of permissions) assert.equal(permission.startsWith('owner.'), false, `${role}:${permission}`)
    }
  }
})


test('shared contract exposes organization document permission keys consumed by backend routes', () => {
  const { loadCivitasSharedContract } = require('../../core/shared/contract-loader.cjs')
  const shared = loadCivitasSharedContract()
  assert.equal(shared.auth.organization.documentPermissions.documentsRead, ORGANIZATION_PERMISSIONS.documentsRead)
  assert.equal(shared.auth.organization.documentPermissions.documentsCreate, ORGANIZATION_PERMISSIONS.documentsCreate)
})
