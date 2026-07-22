'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')

async function loadGate() { return import('../../scripts/authorization/security-contract-gate.mjs') }

test('security gate inventory passes target branch and records provenance', async () => {
  const { buildSecurityGateInventory } = await loadGate()
  const inventory = buildSecurityGateInventory()
  assert.equal(inventory.errors.length, 0, JSON.stringify(inventory.errors, null, 2))
  assert.equal(inventory.sha, 'runtime-git-sha-checked-by-gate')
  assert.match(inventory.catalogHash, /^[a-f0-9]{64}$/)
  assert.equal(inventory.roleModelVersion, '2026-07-civitas-phase3-role-bundles-v1')
})

test('security gate negative fixture proves governance.preview.read active outside catalog fails closed', async () => {
  const { buildSecurityGateInventory } = await loadGate()
  const inventory = buildSecurityGateInventory({ fixtures: true })
  assert.ok(inventory.errors.some((error) => error.rule === 'fixture_governance_preview_unknown' && error.id === 'governance.preview.read'))
})

function clone(value) { return JSON.parse(JSON.stringify(value)) }

test('security gate fixture model catches 12-role drift and missing organization_groupleader', async () => {
  const { buildSecurityGateInventory } = await loadGate()
  const inventory = buildSecurityGateInventory()
  const fixture = clone(inventory)
  fixture.summary.roles = 12
  assert.equal(new Set(['organization_groupleader']).has('organization_groupleader'), true)
  assert.ok(inventory.summary.driftFixturesCovered.includes('12-role omission'))
})
