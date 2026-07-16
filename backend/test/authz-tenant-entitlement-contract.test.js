"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { organizationPath, TENANT_ROUTE_INVENTORY } = require("../routes/tenantRoutes");
const { authorize } = require("../authorization/policies");
const { createEntitlementPolicyProvider, createInMemoryEntitlementRepository, createEntitlementService, evaluateOrganizationEntitlement, buildAuthorizationContext, ENTITLEMENT_REASON_CODES } = require("../authorization/entitlements");

const roleIdToName = { role_admin: "organization_admin", role_director: "organization_director" };
function fakeRes() { return { statusCode: 200, body: null, headers: {}, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; }, set(name, value) { this.headers[name] = value; return this; }, redirect(code, location) { this.statusCode = code; this.headers.Location = location; return this; } }; }
function runtimePort(events = []) { return { async incrementPolicyVersion(event) { events.push({ type: "version", ...event }); return events.filter((e) => e.type === "version").length + 1; }, async enqueueOutbox(event) { events.push({ type: "outbox", ...event }); }, async audit(event) { events.push({ type: "audit", ...event }); } }; }
async function seededRepo() {
  const repository = createInMemoryEntitlementRepository();
  const service = createEntitlementService({ repository, runtimeConsistencyPort: runtimePort(), roleIdToName });
  await service.upsertOwnerLimits({ organizationId: "orgA", expectedPolicyVersion: 1, actorLogtoUserId: "owner", changes: [{ logtoRoleId: "role_admin", permission: "org.documents.create", allowed: true, locked: false }] });
  await service.upsertTenantActivations({ organizationId: "orgA", expectedPolicyVersion: 2, actorLogtoUserId: "admin", changes: [{ logtoRoleId: "role_admin", permission: "org.documents.create", enabled: true }] });
  return repository;
}

test("organizationPath encodes canonical tenant paths and blocks slash injection", () => {
  assert.equal(organizationPath("org_A-1", "documents"), "/o/org_A-1/documents");
  assert.equal(organizationPath("orgA", "/billing/invoices"), "/o/orgA/billing/invoices");
  assert.throws(() => organizationPath("org/A", "documents"), /organization_id/);
  assert.throws(() => organizationPath("orgA", "../documents"), /tenant_relative_path/);
});

test("tenant route inventory distinguishes canonical tenant and owner routes", () => {
  assert.ok(TENANT_ROUTE_INVENTORY.some((route) => route.canonicalPath === "/o/:organizationId/documents" && route.legacyBehavior === "redirect"));
  assert.ok(TENANT_ROUTE_INVENTORY.some((route) => route.surface === "owner" && route.canonicalPath.startsWith("/owner/organizations/:organizationId")));
});

test("policy surface and same-organization reject owner tokens and org/path mismatches", async () => {
  const ownerDecision = await authorize({ principal: { subject: "owner", tokenType: "global", organizationId: null, scopes: new Set(["org.documents.read"]), globalRoleIds: ["owner_global"] }, permission: "org.documents.read", surface: "organization", operation: "read", organizationId: "orgA", policies: [] });
  assert.equal(ownerDecision.allowed, false);
  assert.equal(ownerDecision.reasonCode, "surface_mismatch");
  const mismatchDecision = await authorize({ principal: { subject: "user", tokenType: "organization", organizationId: "orgA", scopes: new Set(["org.documents.read"]), organizationRoleIds: ["organization_member"] }, permission: "org.documents.read", surface: "organization", operation: "read", organizationId: "orgB", policies: ["same-organization"] });
  assert.equal(mismatchDecision.allowed, false);
  assert.equal(mismatchDecision.reasonCode, "organization_route_mismatch");
});

test("entitlement evaluator is deny-by-default and preserves role path provenance", async () => {
  const repository = await seededRepo();
  const allow = await evaluateOrganizationEntitlement({ organizationId: "orgA", subject: "user", tokenScopes: new Set(["org.documents.create"]), rolePaths: [{ rolePathId: "path_admin", logtoRoleId: "role_admin", tokenScopePresent: true }], permission: "org.documents.create", repository, roleIdToName });
  assert.equal(allow.allowed, true);
  assert.equal(allow.matchedRolePathId, "path_admin");
  const missingScope = await evaluateOrganizationEntitlement({ organizationId: "orgA", subject: "user", tokenScopes: new Set(), rolePaths: [{ rolePathId: "path_admin", logtoRoleId: "role_admin", tokenScopePresent: false }], permission: "org.documents.create", repository, roleIdToName });
  assert.equal(missingScope.allowed, false);
  assert.equal(missingScope.evaluatedRolePaths[0].reasonCode, ENTITLEMENT_REASON_CODES.TOKEN_SCOPE_MISSING);
  const fragments = await evaluateOrganizationEntitlement({ organizationId: "orgA", subject: "user", tokenScopes: new Set(["org.documents.create"]), rolePaths: [{ rolePathId: "path_director", logtoRoleId: "role_director", tokenScopePresent: true }, { rolePathId: "path_admin_no_scope", logtoRoleId: "role_admin", tokenScopePresent: false }], permission: "org.documents.create", repository, roleIdToName });
  assert.equal(fragments.allowed, false);
  assert.deepEqual(fragments.evaluatedRolePaths.map((path) => path.reasonCode), [ENTITLEMENT_REASON_CODES.ROLE_PERMISSION_MISSING, ENTITLEMENT_REASON_CODES.TOKEN_SCOPE_MISSING]);
  const unknownRole = await evaluateOrganizationEntitlement({ organizationId: "orgA", subject: "user", tokenScopes: new Set(["org.documents.create"]), rolePaths: [{ rolePathId: "path_unknown", logtoRoleId: "stale_role_id", tokenScopePresent: true }], permission: "org.documents.create", repository, roleIdToName });
  assert.equal(unknownRole.evaluatedRolePaths[0].reasonCode, ENTITLEMENT_REASON_CODES.ORGANIZATION_ROLE_UNKNOWN);
});

test("tenant activation cannot exceed Owner ceiling and locked ceilings block tenant edits", async () => {
  const events = [];
  const repository = createInMemoryEntitlementRepository();
  const service = createEntitlementService({ repository, runtimeConsistencyPort: runtimePort(events), roleIdToName });
  await service.upsertOwnerLimits({ organizationId: "orgA", expectedPolicyVersion: 1, actorLogtoUserId: "owner", changes: [{ logtoRoleId: "role_admin", permission: "org.documents.create", allowed: false, locked: false }] });
  await assert.rejects(() => service.upsertTenantActivations({ organizationId: "orgA", expectedPolicyVersion: 2, actorLogtoUserId: "admin", changes: [{ logtoRoleId: "role_admin", permission: "org.documents.create", enabled: true }] }), /tenant_activation_exceeds_owner_ceiling/);
  await service.upsertOwnerLimits({ organizationId: "orgA", expectedPolicyVersion: 2, actorLogtoUserId: "owner", changes: [{ logtoRoleId: "role_admin", permission: "org.documents.create", allowed: true, locked: true }] });
  await assert.rejects(() => service.upsertTenantActivations({ organizationId: "orgA", expectedPolicyVersion: 3, actorLogtoUserId: "admin", changes: [{ logtoRoleId: "role_admin", permission: "org.documents.create", enabled: false }] }), /tenant_activation_locked/);
  assert.ok(events.some((event) => event.type === "outbox"));
  assert.ok(events.some((event) => event.type === "audit"));
});

test("Owner revocation immediately disables activation without token refresh", async () => {
  const repository = await seededRepo();
  let decision = await evaluateOrganizationEntitlement({ organizationId: "orgA", subject: "user", tokenScopes: new Set(["org.documents.create"]), rolePaths: [{ rolePathId: "path_admin", logtoRoleId: "role_admin", tokenScopePresent: true }], permission: "org.documents.create", repository, roleIdToName });
  assert.equal(decision.allowed, true);
  const service = createEntitlementService({ repository, runtimeConsistencyPort: runtimePort(), roleIdToName });
  await service.upsertOwnerLimits({ organizationId: "orgA", expectedPolicyVersion: 3, actorLogtoUserId: "owner", changes: [{ logtoRoleId: "role_admin", permission: "org.documents.create", allowed: false, locked: false }] });
  decision = await evaluateOrganizationEntitlement({ organizationId: "orgA", subject: "user", tokenScopes: new Set(["org.documents.create"]), rolePaths: [{ rolePathId: "path_admin", logtoRoleId: "role_admin", tokenScopePresent: true }], permission: "org.documents.create", repository, roleIdToName });
  assert.equal(decision.allowed, false);
  assert.equal(decision.evaluatedRolePaths[0].reasonCode, ENTITLEMENT_REASON_CODES.OWNER_CEILING_DENIED);
});

test("#89 entitlement policy denies cross-tenant before overlay and allows only complete path", async () => {
  const repository = await seededRepo();
  const entitlementProvider = createEntitlementPolicyProvider({ repository, roleIdToName });
  const base = { principal: { subject: "user", tokenType: "organization", organizationId: "orgA", scopes: new Set(["org.documents.create"]), organizationRoleIds: ["role_admin"] }, permission: "org.documents.create", surface: "organization", operation: "create", organizationId: "orgA", policies: ["same-organization", "org-role-entitlement-enabled"], providers: { entitlementProvider } };
  assert.equal((await authorize(base)).allowed, true);
  const wrongOrg = await authorize({ ...base, organizationId: "orgB" });
  assert.equal(wrongOrg.allowed, false);
  assert.equal(wrongOrg.reasonCode, "organization_route_mismatch");
  const noScope = await authorize({ ...base, principal: { ...base.principal, scopes: new Set() } });
  assert.equal(noScope.allowed, false);
  assert.equal(noScope.reasonCode, "permission_missing");
});

test("authorization context separates token and effective permissions", async () => {
  const repository = await seededRepo();
  const context = await buildAuthorizationContext({ organizationId: "orgA", repository, roleIdToName, principal: { subject: "user", scopes: new Set(["org.documents.create", "org.documents.read"]), organizationRoleIds: ["role_admin"] }, permissions: ["org.documents.create", "org.documents.read"] });
  assert.deepEqual(context.tokenPermissions, ["org.documents.create", "org.documents.read"]);
  assert.deepEqual(context.effectivePermissions, ["org.documents.create"]);
});
