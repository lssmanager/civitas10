const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAliasesNavigationPolicy, updateNavigationPreferences, previewAccess, listGovernanceAuditEvents } = require('../services/governanceOperationsReadModel');

test('navigation preferences persist without expanding authorization', () => {
  const organizationId = 'org-governance-ops-1';
  const policy = buildAliasesNavigationPolicy(organizationId);
  assert.ok(policy.visualPreferences.some((entry) => entry.screenId === 'tenant-documents'));
  const result = updateNavigationPreferences({ organizationId, actorLogtoUserId: 'admin-1', surface: 'tenant', preferences: [{ screenId: 'tenant-documents', hidden: true, order: 90 }] });
  const preference = result.policy.visualPreferences.find((entry) => entry.screenId === 'tenant-documents');
  assert.equal(preference.hidden, true);
  assert.equal(preference.authorizationEffect, 'presentation_only');
});

test('locked or unknown navigation preferences fail closed', () => {
  assert.throws(() => updateNavigationPreferences({ organizationId: 'org-governance-ops-2', actorLogtoUserId: 'admin-1', surface: 'tenant', preferences: [{ screenId: 'owner-governance', hidden: true }] }), /navigation_locked_item_cannot_be_hidden/);
  assert.throws(() => updateNavigationPreferences({ organizationId: 'org-governance-ops-2', actorLogtoUserId: 'admin-1', surface: 'tenant', preferences: [{ screenId: 'unknown-screen', hidden: true }] }), /navigation_screen_unknown/);
});

test('access preview is read-only, redacted and audited', async () => {
  const preview = await previewAccess({ organizationId: 'org-governance-ops-3', surface: 'tenant', actorLogtoUserId: 'admin-1', body: { previewOnly: true, subjectId: 'person@example.test', actionId: 'documents.read' } });
  assert.equal(preview.mutated, false);
  assert.equal(preview.decision.allowed, true);
  assert.match(preview.subjectId, /^sub_/);
  assert.equal(JSON.stringify(preview).includes('person@example.test'), false);
  const events = listGovernanceAuditEvents({ organizationId: 'org-governance-ops-3' });
  assert.equal(events[0].action, 'governance.access_preview.simulated');
  assert.match(events[0].actorId, /^sub_/);
});

test('access preview rejects mutation-shaped requests and unknown targets', async () => {
  await assert.rejects(() => previewAccess({ organizationId: 'org-governance-ops-4', surface: 'tenant', actorLogtoUserId: 'admin-1', body: { subjectId: 'user-1', actionId: 'documents.read' } }), /access_preview_requires_preview_only/);
  await assert.rejects(() => previewAccess({ organizationId: 'org-governance-ops-4', surface: 'tenant', actorLogtoUserId: 'admin-1', body: { previewOnly: true, subjectId: 'user-1', screenId: 'not-registered' } }), /access_preview_screen_unknown/);
});
