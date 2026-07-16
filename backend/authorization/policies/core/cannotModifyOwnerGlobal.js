"use strict";
const { allow, deny } = require("../policyResult");
const { POLICY_REASON_CODES } = require("../reasonCodes");
const { isOwnerGlobalRoleId } = require("../../delegation");
const POLICY_ID = "cannot-modify-owner-global";
module.exports = Object.freeze({ id: POLICY_ID, version: "2026-07-v1", requiredFacts: [], supportedSurfaces: ["organization", "owner"], async evaluate(context) {
  const candidates = [context.target?.roleId, ...(Array.isArray(context.target?.roleIds) ? context.target.roleIds : [])].filter(Boolean);
  if (context.request.surface === "organization" && candidates.some(isOwnerGlobalRoleId)) return deny(POLICY_ID, POLICY_REASON_CODES.OWNER_GLOBAL_MODIFICATION_FORBIDDEN);
  return allow(POLICY_ID);
}});
