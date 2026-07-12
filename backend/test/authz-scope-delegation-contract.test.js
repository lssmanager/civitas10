const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { requirePermission } = require("../middleware/requirePermission");
const { createInMemoryDelegationRepository, evaluateRoleDelegation, createDelegationService, DELEGATION_REASON_CODES } = require("../authorization/delegation");

function res() { return { statusCode: null, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } }; }
function invoke(mw, req) { const r = res(); let called = false; mw(req, r, () => { called = true; }); return { called, response: r }; }

const ORG = "org_123";
const ADMIN = "role_admin";
const DIRECTOR = "role_director";
const TEACHER = "role_teacher";
const MEMBER = "role_member";
const knownRoleIds = new Set([ADMIN, DIRECTOR, TEACHER, MEMBER]);

async function decisionWith({ actorRoleIds = [ADMIN], targetRoleId = TEACHER, operation = "assign", restrictions = [], baselineRules = [{ grantorLogtoRoleId: ADMIN, targetLogtoRoleId: TEACHER, canAssign: true, canRevoke: false, isActive: true }] } = {}) {
  return evaluateRoleDelegation({ organizationId: ORG, actorRoleIds, targetRoleId, operation, knownRoleIds, repository: createInMemoryDelegationRepository({ baselineRules, restrictions }) });
}

test("#75: role name never replaces verified token scope", () => {
  const { called, response } = invoke(requirePermission("org.documents.create"), { auth: { scopes: new Set(), organizationRoles: ["organization_admin"] } });
  assert.equal(called, false);
  assert.equal(response.statusCode, 403);
});

test("#92: explicit baseline allows and missing baseline denies", async () => {
  assert.equal((await decisionWith()).allowed, true);
  const missing = await decisionWith({ baselineRules: [] });
  assert.equal(missing.allowed, false);
  assert.equal(missing.reasonCode, DELEGATION_REASON_CODES.RULE_MISSING);
});

test("#92: assign and revoke decisions are independent", async () => {
  const revoke = await decisionWith({ operation: "revoke" });
  assert.equal(revoke.allowed, false);
  assert.equal(revoke.reasonCode, DELEGATION_REASON_CODES.OPERATION_DENIED);
});

test("#92: tenant restriction only disables and never expands", async () => {
  const restricted = await decisionWith({ restrictions: [{ logtoOrganizationId: ORG, grantorLogtoRoleId: ADMIN, targetLogtoRoleId: TEACHER, assignDisabled: true, revokeDisabled: false, isActive: true }] });
  assert.equal(restricted.allowed, false);
  assert.equal(restricted.reasonCode, DELEGATION_REASON_CODES.TENANT_RESTRICTED);
  const noBaseline = await decisionWith({ baselineRules: [], restrictions: [{ logtoOrganizationId: ORG, grantorLogtoRoleId: ADMIN, targetLogtoRoleId: TEACHER, assignDisabled: false, revokeDisabled: false, isActive: true }] });
  assert.equal(noBaseline.allowed, false);
});

test("#92: multiple roles keep provenance and do not combine paths", async () => {
  const decision = await decisionWith({ actorRoleIds: [MEMBER, DIRECTOR], baselineRules: [
    { grantorLogtoRoleId: MEMBER, targetLogtoRoleId: TEACHER, canAssign: false, canRevoke: true, isActive: true },
    { grantorLogtoRoleId: DIRECTOR, targetLogtoRoleId: TEACHER, canAssign: true, canRevoke: false, isActive: true },
  ] });
  assert.equal(decision.allowed, true);
  assert.equal(decision.matchedGrantorRoleId, DIRECTOR);
  assert.equal(decision.evaluatedRolePaths.length, 2);
});

test("#92: unknown, stale, self, cross-tenant and owner_global paths deny", async () => {
  assert.equal((await decisionWith({ actorRoleIds: ["stale_role"] })).reasonCode, DELEGATION_REASON_CODES.ACTOR_ROLE_UNKNOWN);
  assert.equal((await decisionWith({ targetRoleId: "stale_role" })).reasonCode, DELEGATION_REASON_CODES.TARGET_ROLE_UNKNOWN);
  assert.equal((await evaluateRoleDelegation({ organizationId: ORG, actorRoleIds: [ADMIN], targetRoleId: "owner_global", operation: "assign" })).reasonCode, DELEGATION_REASON_CODES.OWNER_GLOBAL_FORBIDDEN);
  assert.equal((await evaluateRoleDelegation({ organizationId: ORG, actorRoleIds: [ADMIN], targetRoleId: TEACHER, operation: "assign", actorUserId: "u1", targetUserId: "u1" })).reasonCode, DELEGATION_REASON_CODES.SELF_ASSIGNMENT_FORBIDDEN);
  assert.equal((await evaluateRoleDelegation({ organizationId: ORG, requestOrganizationId: "other", actorRoleIds: [ADMIN], targetRoleId: TEACHER, operation: "assign" })).reasonCode, DELEGATION_REASON_CODES.CROSS_TENANT_FORBIDDEN);
});

test("#92 service audits and requires #101 invalidation port for mutations", async () => {
  const events = [];
  const portEvents = [];
  const service = createDelegationService({
    repository: createInMemoryDelegationRepository(),
    auditPort: { record: async (event) => events.push(event) },
    policyInvalidationPort: { incrementPolicyVersion: async () => 42, enqueueInvalidation: async (event) => portEvents.push(event) },
  });
  await service.upsertBaselineRule({ actorLogtoUserId: "owner_user", grantorLogtoRoleId: ADMIN, targetLogtoRoleId: TEACHER, canAssign: true });
  assert.equal(events[0].action, "authz.delegation_rule.updated");
  assert.equal(portEvents[0].policyVersion, 42);
  await assert.rejects(() => service.upsertOrganizationRestriction({ actorLogtoUserId: "tenant_user", logtoOrganizationId: ORG, grantorLogtoRoleId: ADMIN, targetLogtoRoleId: TEACHER, assignEnabled: true }));
});

test("integration: scope and delegation are both necessary but not final #89 authorization", async () => {
  const scopeMissing = invoke(requirePermission("org.documents.create"), { auth: { scopes: new Set(), organizationRoles: ["organization_admin"] } });
  const delegationAllowed = await decisionWith();
  assert.equal(scopeMissing.called, false);
  assert.equal(delegationAllowed.allowed, true);

  const scopePresent = invoke(requirePermission("org.documents.create"), { auth: { scopes: new Set(["org.documents.create"]), organizationRoles: [] } });
  const noDelegation = await decisionWith({ baselineRules: [] });
  assert.equal(scopePresent.called, true);
  assert.equal(noDelegation.allowed, false);

  const preliminaryAllow = scopePresent.called && delegationAllowed.allowed;
  assert.equal(preliminaryAllow, true);
});

test("schema and migration declare constraints and do not create local role/permission authority tables", () => {
  const schema = fs.readFileSync(path.join(__dirname, "..", "db", "schema", "authz-delegation.js"), "utf8");
  const migration = fs.readFileSync(path.join(__dirname, "..", "db", "migrations", "0006_authz_delegation_limits.sql"), "utf8");
  assert.match(schema, /role_delegation_rules/);
  assert.match(schema, /org_delegation_restrictions/);
  assert.match(migration, /CHECK \(grantor_logto_role_id <> target_logto_role_id\)/);
  assert.doesNotMatch(schema, /can_impersonate|impersonation_enabled|org_roles|organization_permissions/);
});
