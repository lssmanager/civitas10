const test = require("node:test");
const assert = require("node:assert/strict");
const { requirePermission } = require("../middleware/requirePermission");
const { requireSeats } = require("../middleware/requireSeats");
const { GLOBAL_ROLES, ORGANIZATION_ROLES } = require("../authorization/roles");
function res() { return { statusCode: null, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } }; }


test("organization roles match verified Logto role names", () => {
  assert.deepEqual(Object.values(ORGANIZATION_ROLES), [
    "organization_accountant",
    "organization_admin",
    "organization_billing",
    "organization_director",
    "organization_headdirector",
    "organization_headteacher",
    "organization_member",
    "organization_parent",
    "organization_payroll",
    "organization_secretary",
    "organization_student",
    "organization_teacher",
  ]);
});

test("owner accesses any permission by wildcard", () => { const r = res(); let called = false; requirePermission("billing:manage")({ user: { roles: [GLOBAL_ROLES.OWNER] } }, r, () => { called = true; }); assert.equal(called, true); });
test("organization_admin can execute lms enroll", () => { const r = res(); let called = false; requirePermission("lms:enroll")({ user: { roles: [ORGANIZATION_ROLES.ADMIN] } }, r, () => { called = true; }); assert.equal(called, true); });
test("organization_student cannot execute lms enroll", () => { const r = res(); requirePermission("lms:enroll")({ user: { roles: [ORGANIZATION_ROLES.STUDENT] } }, r, () => assert.fail("next should not be called")); assert.equal(r.statusCode, 403); assert.equal(r.body.required, "lms:enroll"); });
test("missing user returns 401", () => { const r = res(); requirePermission("members:invite")({}, r, () => assert.fail("next should not be called")); assert.equal(r.statusCode, 401); });
test("missing permission returns 403 with canonical required field", () => { const r = res(); requirePermission("members:invite")({ user: { roles: [GLOBAL_ROLES.SUPPORT_AGENT] } }, r, () => assert.fail("next should not be called")); assert.equal(r.statusCode, 403); assert.equal(r.body.required, "members:invite"); assert.deepEqual(r.body.roles, [GLOBAL_ROLES.SUPPORT_AGENT]); });
test("requireSeats without req.org returns 500", async () => { const r = res(); await requireSeats({}, r, () => assert.fail("next should not be called")); assert.equal(r.statusCode, 500); assert.match(r.body.detail, /requireOrg/); });
test("requireSeats with no seats available returns 422 with action", async () => { const r = res(); await requireSeats({ org: { seats_total: 3, seats_used: 3, seats_available: 0 } }, r, () => assert.fail("next should not be called")); assert.equal(r.statusCode, 422); assert.ok(r.body.action); });
test("requireSeats with seats available calls next", async () => { const r = res(); let called = false; const req = { org: { seats_total: 3, seats_used: 1, seats_available: 2 } }; await requireSeats(req, r, () => { called = true; }); assert.equal(called, true); });

test("requireOrg with suspended org returns 403 with action", async () => {
  const dbPath = require.resolve("../lib/db");
  const requireOrgPath = require.resolve("../middleware/requireOrg");
  const originalDb = require.cache[dbPath];
  delete require.cache[requireOrgPath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: { queryPostgres: async () => ({ rows: [{ id: "org-1", logto_organization_id: "logto-org-1", status: "suspended", plan: "basic", seats_total: 1, seats_used: 0 }] }) },
  };
  const { requireOrg } = require("../middleware/requireOrg");
  const r = res();
  await requireOrg({ params: { id: "org-1" } }, r, () => assert.fail("next should not be called"));
  assert.equal(r.statusCode, 403);
  assert.ok(r.body.action);
  delete require.cache[requireOrgPath];
  if (originalDb) require.cache[dbPath] = originalDb;
  else delete require.cache[dbPath];
});

test("canonical middleware chain reaches handler", async () => {
  const calls = [];
  const requireAuth = (req, _res, next) => { req.user = { roles: [GLOBAL_ROLES.OWNER] }; calls.push("auth"); next(); };
  const requireOrg = (req, _res, next) => { req.org = { id: "org-1", seats_total: 2, seats_used: 1, seats_available: 1 }; calls.push("org"); next(); };
  const permission = requirePermission("members:invite");
  const r = res();
  const req = {};
  await new Promise((resolve) => requireAuth(req, r, resolve));
  await new Promise((resolve) => requireOrg(req, r, resolve));
  await new Promise((resolve) => permission(req, r, resolve));
  await new Promise((resolve) => requireSeats(req, r, resolve));
  calls.push("handler");
  assert.deepEqual(calls, ["auth", "org", "handler"]);
});
