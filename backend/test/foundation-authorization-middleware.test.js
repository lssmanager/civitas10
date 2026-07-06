const test = require("node:test");
const assert = require("node:assert/strict");
const { requirePermission } = require("../middleware/requirePermission");
const { requireSeats } = require("../middleware/requireSeats");
function res() { return { statusCode: null, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } }; }

test("owner accesses any permission by wildcard", () => { const r = res(); let called = false; requirePermission("billing:manage")({ user: { roles: ["owner_global"] } }, r, () => { called = true; }); assert.equal(called, true); });
test("organization student cannot execute lms enroll", () => { const r = res(); requirePermission("lms:enroll")({ user: { organizationRoles: ["organization:student"] } }, r, () => assert.fail("next should not be called")); assert.equal(r.statusCode, 403); assert.equal(r.body.requiredPermission, "lms:enroll"); });
test("missing user returns 401", () => { const r = res(); requirePermission("members:invite")({}, r, () => assert.fail("next should not be called")); assert.equal(r.statusCode, 401); });
test("missing permission returns 403", () => { const r = res(); requirePermission("members:invite")({ user: { roles: ["support_agent"] } }, r, () => assert.fail("next should not be called")); assert.equal(r.statusCode, 403); assert.equal(r.body.action, "ask_owner_to_assign_required_role"); });
test("requireSeats without req.org returns 400", () => { const r = res(); requireSeats({}, r, () => assert.fail("next should not be called")); assert.equal(r.statusCode, 400); });
test("requireSeats without seats returns 422 with action", () => { const r = res(); requireSeats({ org: { seats_total: 3, seats_used: 3 } }, r, () => assert.fail("next should not be called")); assert.equal(r.statusCode, 422); assert.ok(r.body.action); });
test("requireSeats with seats available calls next", () => { const r = res(); let called = false; const req = { org: { seats_total: 3, seats_used: 1 } }; requireSeats(req, r, () => { called = true; }); assert.equal(called, true); assert.equal(req.seats.available, 2); });
