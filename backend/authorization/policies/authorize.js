"use strict";

const { permissionsByName } = require("../../../core/authz");
const { buildPolicyContext } = require("./policyContext");
const { POLICY_REASON_CODES } = require("./reasonCodes");
const { createDefaultPolicyRegistry } = require("./defaultRegistry");
const { sanitizeMetadata } = require("./policyResult");

function denyDecision(context, reasonCode, extra = {}) {
  return Object.freeze({ allowed: false, decisionId: context.decisionId, permission: context.authorization.permission, actionId: context.authorization.actionId, surface: context.request.surface, organizationId: context.principal.organizationId || undefined, evaluatedRolePaths: sanitizeRolePaths(context.rolePaths), policyVersion: context.authorization.policyVersion, reasonCode, safeMetadata: sanitizeMetadata(extra) });
}
function allowDecision(context, matchedRolePathId) {
  return Object.freeze({ allowed: true, decisionId: context.decisionId, permission: context.authorization.permission, actionId: context.authorization.actionId, surface: context.request.surface, organizationId: context.principal.organizationId || undefined, matchedRolePathId, evaluatedRolePaths: sanitizeRolePaths(context.rolePaths), policyVersion: context.authorization.policyVersion, reasonCode: POLICY_REASON_CODES.AUTHORIZATION_ALLOWED, safeMetadata: {} });
}
function sanitizeRolePaths(paths) {
  return (paths || []).map((path) => ({ rolePathId: path.rolePathId, logtoRoleId: path.logtoRoleId, tokenScopePresent: Boolean(path.tokenScopePresent), delegationDecision: path.delegationDecision ? { operation: path.delegationDecision.operation, targetRoleId: path.delegationDecision.targetRoleId, allowed: path.delegationDecision.allowed, reasonCode: path.delegationDecision.reasonCode } : undefined, entitlementDecision: path.entitlementDecision, dataScopeDecision: path.dataScopeDecision, policyResults: (path.policyResults || []).map((result) => ({ policyId: result.policyId, outcome: result.outcome, reasonCode: result.reasonCode })) }));
}
function surfaceMatches(context) {
  if (context.request.surface === "owner") return context.principal.tokenType === "global" && !context.principal.organizationId;
  if (context.request.surface === "organization") return context.principal.tokenType === "organization" && Boolean(context.principal.organizationId);
  return Boolean(context.principal.subject);
}
async function authorize(input) {
  const registry = input.registry || createDefaultPolicyRegistry();
  const context = buildPolicyContext(input);
  context.providers = input.providers || {};
  if (!context.principal.subject) return denyDecision(context, POLICY_REASON_CODES.SURFACE_MISMATCH);
  const permission = permissionsByName[context.authorization.permission];
  if (!permission || permission.status !== "active") return denyDecision(context, POLICY_REASON_CODES.PERMISSION_INACTIVE);
  if (!context.principal.scopes.has(context.authorization.permission)) return denyDecision(context, POLICY_REASON_CODES.PERMISSION_MISSING);
  if (!surfaceMatches(context)) return denyDecision(context, POLICY_REASON_CODES.SURFACE_MISMATCH);
  if (context.request.surface !== "self" && context.rolePaths.length === 0) return denyDecision(context, POLICY_REASON_CODES.ROLE_PATH_MISSING);
  let matchedRolePathId = context.rolePaths[0]?.rolePathId;
  for (const policyId of context.authorization.requiredPolicies) {
    const policy = registry.getPolicy(policyId);
    if (!policy) return denyDecision(context, POLICY_REASON_CODES.POLICY_UNKNOWN, { policyId });
    if (!policy.supportedSurfaces.includes(context.request.surface)) return denyDecision(context, POLICY_REASON_CODES.SURFACE_MISMATCH, { policyId });
    try {
      const result = await policy.evaluate(context);
      for (const path of context.rolePaths) path.policyResults.push(result);
      if (result.outcome === "not_applicable" && !policy.allowNotApplicable) return denyDecision(context, result.reasonCode || POLICY_REASON_CODES.POLICY_EVALUATION_FAILED, { policyId });
      if (result.outcome === "deny") return denyDecision(context, result.reasonCode, { policyId });
      if (result.metadata?.rolePathId) matchedRolePathId = result.metadata.rolePathId;
      if (result.metadata?.matchedGrantorRoleId) {
        const matched = context.rolePaths.find((path) => path.logtoRoleId === result.metadata.matchedGrantorRoleId);
        if (matched) matchedRolePathId = matched.rolePathId;
      }
    } catch (error) {
      return denyDecision(context, POLICY_REASON_CODES.POLICY_EVALUATION_FAILED, { policyId });
    }
  }
  if (context.rolePaths.length > 0 && !context.rolePaths.some((path) => path.tokenScopePresent)) return denyDecision(context, POLICY_REASON_CODES.PERMISSION_MISSING);
  return allowDecision(context, matchedRolePathId);
}
module.exports = { authorize, sanitizeRolePaths };
