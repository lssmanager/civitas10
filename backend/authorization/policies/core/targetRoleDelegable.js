"use strict";
const { allow, deny } = require("../policyResult");
const { POLICY_REASON_CODES } = require("../reasonCodes");
const POLICY_ID = "target-role-delegable";
const DELEGATION_REASON_MAP = Object.freeze({
  delegation_allowed: POLICY_REASON_CODES.AUTHORIZATION_ALLOWED,
  delegation_rule_missing: POLICY_REASON_CODES.DELEGATION_RULE_MISSING,
  delegation_operation_denied: POLICY_REASON_CODES.DELEGATION_OPERATION_DENIED,
  delegation_tenant_restricted: POLICY_REASON_CODES.DELEGATION_TENANT_RESTRICTED,
  delegation_owner_global_forbidden: POLICY_REASON_CODES.OWNER_GLOBAL_MODIFICATION_FORBIDDEN,
  delegation_self_assignment_forbidden: POLICY_REASON_CODES.SELF_PRIVILEGE_CHANGE_FORBIDDEN,
  delegation_actor_role_unknown: POLICY_REASON_CODES.TARGET_ROLE_NOT_DELEGABLE,
  delegation_target_role_unknown: POLICY_REASON_CODES.TARGET_ROLE_UNKNOWN,
  delegation_cross_tenant_forbidden: POLICY_REASON_CODES.ORGANIZATION_ROUTE_MISMATCH,
});
module.exports = Object.freeze({ id: POLICY_ID, version: "2026-07-v1", requiredFacts: ["delegationProvider"], supportedSurfaces: ["organization"], async evaluate(context) {
  if (!["assign", "revoke"].includes(context.request.operation)) return deny(POLICY_ID, POLICY_REASON_CODES.TARGET_ROLE_NOT_DELEGABLE);
  const provider = context.providers?.delegationProvider;
  if (!provider?.evaluateDelegation) return deny(POLICY_ID, POLICY_REASON_CODES.POLICY_PROVIDER_MISSING);
  const decision = await provider.evaluateDelegation({ organizationId: context.principal.organizationId, actorRoleIds: context.rolePaths.map((path) => path.logtoRoleId), targetRoleId: context.target?.roleId, operation: context.request.operation, actorUserId: context.principal.subject, targetUserId: context.target?.userId });
  context.facts.delegationDecision = decision;
  for (const path of context.rolePaths) {
    const matched = (decision.evaluatedRolePaths || []).find((rolePath) => rolePath.grantorRoleId === path.logtoRoleId);
    path.delegationDecision = matched ? { operation: context.request.operation, targetRoleId: context.target?.roleId, allowed: matched.allowed, reasonCode: decision.reasonCode } : { operation: context.request.operation, targetRoleId: context.target?.roleId, allowed: false, reasonCode: decision.reasonCode };
  }
  return decision.allowed ? allow(POLICY_ID, POLICY_REASON_CODES.AUTHORIZATION_ALLOWED, { matchedGrantorRoleId: decision.matchedGrantorRoleId }) : deny(POLICY_ID, DELEGATION_REASON_MAP[decision.reasonCode] || POLICY_REASON_CODES.TARGET_ROLE_NOT_DELEGABLE);
}});
