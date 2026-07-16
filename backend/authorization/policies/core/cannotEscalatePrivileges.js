"use strict";
const { allow, deny } = require("../policyResult");
const { POLICY_REASON_CODES } = require("../reasonCodes");
const { isOwnerGlobalRoleId } = require("../../delegation");
const POLICY_ID = "cannot-escalate-privileges";
module.exports = Object.freeze({ id: POLICY_ID, version: "2026-07-v1", requiredFacts: [], supportedSurfaces: ["organization"], async evaluate(context) {
  const targetRoleId = context.target?.roleId;
  if (!targetRoleId) return deny(POLICY_ID, POLICY_REASON_CODES.TARGET_ROLE_UNKNOWN);
  if (isOwnerGlobalRoleId(targetRoleId)) return deny(POLICY_ID, POLICY_REASON_CODES.OWNER_GLOBAL_MODIFICATION_FORBIDDEN);
  if (context.target?.userId && context.target.userId === context.principal.subject) return deny(POLICY_ID, POLICY_REASON_CODES.SELF_PRIVILEGE_CHANGE_FORBIDDEN);
  const delegation = context.facts.delegationDecision;
  if (!delegation || !delegation.allowed) return deny(POLICY_ID, POLICY_REASON_CODES.TARGET_ROLE_NOT_DELEGABLE);
  const matchingPath = context.rolePaths.find((path) => path.delegationDecision?.allowed);
  if (!matchingPath) return deny(POLICY_ID, POLICY_REASON_CODES.PRIVILEGE_COMPARISON_UNAVAILABLE);
  return allow(POLICY_ID, POLICY_REASON_CODES.AUTHORIZATION_ALLOWED, { rolePathId: matchingPath.rolePathId });
}});
