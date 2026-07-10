const test = require("node:test");
const assert = require("node:assert/strict");

const { CAPABILITIES, VALID_CAPABILITIES, isSupportedCapability } = require("../../contracts");

const FORBIDDEN_INTERNAL_CAPABILITIES = Object.freeze([
  "auth",
  "authorization",
  "owner_global",
  "worker",
  "audit",
  "health",
  "organization",
  "role_mapping",
  "crm_sync",
  "billing",
]);

const EXPECTED_ROOT_CAPABILITIES = Object.freeze([
  "identity",
  "lms",
  "crm",
  "marketing",
  "support",
  "scheduling",
  "payments",
  "email",
  "storage",
  "analytics",
  "notifications",
  "automation",
  "community",
]);

test("root VALID_CAPABILITIES rejects internal platform concepts", () => {
  const validCapabilities = Object.values(VALID_CAPABILITIES);

  for (const forbiddenCapability of FORBIDDEN_INTERNAL_CAPABILITIES) {
    assert.equal(
      validCapabilities.includes(forbiddenCapability),
      false,
      `${forbiddenCapability} belongs to auth/rbac/runtime/observability, not connector capabilities`,
    );
    assert.equal(isSupportedCapability(forbiddenCapability), false);
  }
});

test("root capability contract remains capability-first and derived", () => {
  assert.deepEqual(CAPABILITIES, EXPECTED_ROOT_CAPABILITIES);
  assert.deepEqual(CAPABILITIES, Object.values(VALID_CAPABILITIES));

  for (const capability of EXPECTED_ROOT_CAPABILITIES) {
    assert.equal(isSupportedCapability(capability), true);
  }
});
