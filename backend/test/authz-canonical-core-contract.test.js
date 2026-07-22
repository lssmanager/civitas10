const test = require("node:test");
const assert = require("node:assert/strict");
const { authorize, POLICY_REASON_CODES } = require("../authorization/policies");

const ORG = "org_A";
const principal = (overrides = {}) => ({
  subject: "user_A",
  tokenType: "organization",
  organizationId: ORG,
  scopes: new Set(["org.documents.read"]),
  organizationRoleIds: ["organization_admin"],
  ...overrides,
});
const providers = (overrides = {}) => ({
  membershipProvider: { async evaluateMembership() { return { status: "active" }; } },
  entitlementProvider: {
    async evaluate({ rolePaths }) { return { allowed: true, policyVersion: "test-v1", matchedRolePathId: rolePaths.find((path) => path.rolePotentialDecision?.allowed)?.rolePathId, evaluatedRolePaths: rolePaths.map((path) => ({ rolePathId: path.rolePathId, allowed: Boolean(path.rolePotentialDecision?.allowed), reasonCode: path.rolePotentialDecision?.reasonCode })) }; },
    async evaluateSnapshot() { return { status: "current", policyVersion: "test-v1" }; },
  },
  dataScopeProvider: { async evaluate() { return { allowed: true, status: "valid", strategy: "organization" }; } },
  ...overrides,
});
const input = (overrides = {}) => ({ principal: principal(), permission: "org.documents.read", surface: "organization", operation: "read", organizationId: ORG, policies: [], providers: providers(), ...overrides });

test("policies=[] cannot bypass canonical role potential enforcement", async () => {
  const decision = await authorize(input({ principal: principal({ organizationRoleIds: ["arbitrary_role"] }) }));
  assert.equal(decision.allowed, false);
  assert.equal(decision.reasonCode, POLICY_REASON_CODES.ORGANIZATION_ROLE_UNKNOWN);
});

test("scope and valid role are insufficient when role potential excludes permission", async () => {
  const decision = await authorize(input({ permission: "org.documents.create", principal: principal({ scopes: new Set(["org.documents.create"]), organizationRoleIds: ["organization_teacher"] }) }));
  assert.equal(decision.allowed, false);
  assert.equal(decision.reasonCode, POLICY_REASON_CODES.ROLE_PERMISSION_MISSING);
});

test("missing Owner Ceiling / Tenant Activation provider denies even with policies=[]", async () => {
  const decision = await authorize(input({ providers: providers({ entitlementProvider: undefined }) }));
  assert.equal(decision.allowed, false);
  assert.equal(decision.reasonCode, POLICY_REASON_CODES.POLICY_PROVIDER_MISSING);
});

test("stale authorization snapshot denies", async () => {
  const decision = await authorize(input({ providers: providers({ entitlementProvider: { async evaluate({ rolePaths }) { return { allowed: true, matchedRolePathId: rolePaths[0].rolePathId, evaluatedRolePaths: [] }; }, async evaluateSnapshot() { return { status: "stale" }; } } }) }));
  assert.equal(decision.allowed, false);
  assert.equal(decision.reasonCode, POLICY_REASON_CODES.AUTHORIZATION_SNAPSHOT_STALE);
});

test("missing ABAC/Data Scope provider denies scoped operation", async () => {
  const decision = await authorize(input({ providers: providers({ dataScopeProvider: undefined }) }));
  assert.equal(decision.allowed, false);
  assert.equal(decision.reasonCode, POLICY_REASON_CODES.POLICY_PROVIDER_MISSING);
});

test("caller additional restrictive policy executes after canonical plan", async () => {
  const decision = await authorize(input({ policies: ["resource-belongs-to-organization"], resource: { type: "document", id: "doc-1", organizationId: "other" } }));
  assert.equal(decision.allowed, false);
  assert.equal(decision.reasonCode, POLICY_REASON_CODES.RESOURCE_ORGANIZATION_MISMATCH);
});

test("planned permission with malformed token scope is denied before PBAC", async () => {
  const decision = await authorize(input({ permission: "lms.grades.export", principal: principal({ scopes: new Set(["lms.grades.export"]), organizationRoleIds: ["organization_teacher"] }) }));
  assert.equal(decision.allowed, false);
  assert.equal(decision.reasonCode, POLICY_REASON_CODES.PERMISSION_INACTIVE);
});
