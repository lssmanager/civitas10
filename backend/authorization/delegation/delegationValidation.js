"use strict";

const OWNER_GLOBAL_ROLE_ID = "owner_global";
const LOGTO_ID_PATTERN = /^[A-Za-z0-9_:-]{1,128}$/;

function assertLogtoId(value, fieldName) {
  if (typeof value !== "string" || !LOGTO_ID_PATTERN.test(value)) {
    throw new Error(`${fieldName} must be a Logto string identifier (1-128 chars)`);
  }
}

function isOwnerGlobalRoleId(value) {
  return value === OWNER_GLOBAL_ROLE_ID || value === "role_owner_global" || value === "role:owner_global";
}

function assertDelegationPair({ grantorLogtoRoleId, targetLogtoRoleId }) {
  assertLogtoId(grantorLogtoRoleId, "grantor_logto_role_id");
  assertLogtoId(targetLogtoRoleId, "target_logto_role_id");
  if (grantorLogtoRoleId === targetLogtoRoleId) throw new Error("grantor and target roles must differ");
  if (isOwnerGlobalRoleId(grantorLogtoRoleId) || isOwnerGlobalRoleId(targetLogtoRoleId)) throw new Error("owner_global is forbidden in tenant delegation");
}

function normalizeRoleIds(roleIds) {
  return [...new Set((roleIds || []).map(String).filter(Boolean))].sort();
}

module.exports = { OWNER_GLOBAL_ROLE_ID, assertLogtoId, assertDelegationPair, isOwnerGlobalRoleId, normalizeRoleIds };
