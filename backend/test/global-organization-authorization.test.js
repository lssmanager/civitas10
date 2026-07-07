const test = require("node:test");
const assert = require("node:assert/strict");
const { requireGlobalOwner } = require("../authorization/guards");
const { requireOrganizationRole } = require("../authorization/guards");

function res() { return { statusCode: null, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } }; }

test("owner_global without organization membership passes requireGlobalOwner", () => {
  const r = res();
  let called = false;
  requireGlobalOwner({ user: { globalRoles: ["owner_global"], organizationRoles: [], organizationId: null } }, r, () => { called = true; });
  assert.equal(called, true);
  assert.equal(r.statusCode, null);
});

test("organization_admin alone cannot pass requireGlobalOwner", () => {
  const r = res();
  requireGlobalOwner({ user: { globalRoles: [], organizationRoles: ["organization_admin"], organizationId: "org-1" } }, r, () => assert.fail("next should not be called"));
  assert.equal(r.statusCode, 403);
  assert.equal(r.body.requiredGlobalRole, "owner_global");
});

test("owner_global still needs organization context and role for organization authorization", () => {
  const r = res();
  requireOrganizationRole("organization_admin")({ user: { globalRoles: ["owner_global"], organizationRoles: [], organizationId: null } }, r, () => assert.fail("next should not be called"));
  assert.equal(r.statusCode, 403);
  assert.equal(r.body.error, "OrganizationContextRequired");
});

test("organization member role passes only with organization context", () => {
  const r = res();
  let called = false;
  const req = { user: { organizationId: "org-1", organizationRoles: ["organization_member"] } };
  requireOrganizationRole("organization_member")(req, r, () => { called = true; });
  assert.equal(called, true);
  assert.equal(req.org, undefined);
});
