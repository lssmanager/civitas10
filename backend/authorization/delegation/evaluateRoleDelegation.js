"use strict";

const { DELEGATION_REASON_CODES } = require("./delegationReasonCodes");
const { isOwnerGlobalRoleId, normalizeRoleIds } = require("./delegationValidation");

function restrictionMatches(restriction, grantorRoleId, targetRoleId, organizationId) {
  return restriction && restriction.isActive !== false && restriction.logtoOrganizationId === organizationId && restriction.grantorLogtoRoleId === grantorRoleId && restriction.targetLogtoRoleId === targetRoleId;
}

function evaluateRoleDelegationFromState({ organizationId, requestOrganizationId, actorRoleIds = [], targetRoleId, operation, baselineRules = [], restrictions = [], knownRoleIds, actorUserId, targetUserId } = {}) {
  if (!["assign", "revoke"].includes(operation)) throw new Error("operation must be assign or revoke");
  if (requestOrganizationId && organizationId && requestOrganizationId !== organizationId) return deny(DELEGATION_REASON_CODES.CROSS_TENANT_FORBIDDEN, { organizationId, targetRoleId, operation });
  if (actorUserId && targetUserId && actorUserId === targetUserId) return deny(DELEGATION_REASON_CODES.SELF_ASSIGNMENT_FORBIDDEN, { organizationId, targetRoleId, operation, isSelfAssignment: true });
  if (isOwnerGlobalRoleId(targetRoleId) || normalizeRoleIds(actorRoleIds).some(isOwnerGlobalRoleId)) return deny(DELEGATION_REASON_CODES.OWNER_GLOBAL_FORBIDDEN, { organizationId, targetRoleId, operation });
  const roleSet = knownRoleIds ? new Set([...knownRoleIds].map(String)) : null;
  const roles = normalizeRoleIds(actorRoleIds);
  if (roleSet && roles.some((roleId) => !roleSet.has(roleId))) return deny(DELEGATION_REASON_CODES.ACTOR_ROLE_UNKNOWN, { organizationId, targetRoleId, operation });
  if (roleSet && !roleSet.has(targetRoleId)) return deny(DELEGATION_REASON_CODES.TARGET_ROLE_UNKNOWN, { organizationId, targetRoleId, operation });

  const evaluatedRolePaths = roles.map((grantorRoleId) => {
    const baseline = baselineRules.find((rule) => rule.isActive !== false && rule.grantorLogtoRoleId === grantorRoleId && rule.targetLogtoRoleId === targetRoleId);
    const baselineAllowed = Boolean(baseline && (operation === "assign" ? baseline.canAssign : baseline.canRevoke));
    const restriction = restrictions.find((candidate) => restrictionMatches(candidate, grantorRoleId, targetRoleId, organizationId));
    const tenantRestricted = Boolean(restriction && (operation === "assign" ? restriction.assignDisabled : restriction.revokeDisabled));
    return { grantorRoleId, baselineExists: Boolean(baseline), baselineAllowed, tenantRestricted, allowed: Boolean(baselineAllowed && !tenantRestricted) };
  });

  const allowedPath = evaluatedRolePaths.find((path) => path.allowed);
  if (allowedPath) return { allowed: true, operation, organizationId, targetRoleId, matchedGrantorRoleId: allowedPath.grantorRoleId, evaluatedRolePaths, reasonCode: DELEGATION_REASON_CODES.ALLOWED };
  if (evaluatedRolePaths.some((path) => path.tenantRestricted)) return deny(DELEGATION_REASON_CODES.TENANT_RESTRICTED, { organizationId, targetRoleId, operation, evaluatedRolePaths });
  if (evaluatedRolePaths.some((path) => path.baselineExists && !path.baselineAllowed)) return deny(DELEGATION_REASON_CODES.OPERATION_DENIED, { organizationId, targetRoleId, operation, evaluatedRolePaths });
  return deny(DELEGATION_REASON_CODES.RULE_MISSING, { organizationId, targetRoleId, operation, evaluatedRolePaths });
}

function deny(reasonCode, extra) { return { allowed: false, evaluatedRolePaths: [], ...extra, reasonCode }; }

async function evaluateRoleDelegation({ repository, ...input } = {}) {
  if (!repository) return evaluateRoleDelegationFromState(input);
  const actorRoleIds = normalizeRoleIds(input.actorRoleIds);
  const [baselineRules, restrictions] = await Promise.all([
    repository.getBaselineRulesForGrantors(actorRoleIds, input.targetRoleId),
    repository.getRestrictionsForOrganization(input.organizationId, actorRoleIds, input.targetRoleId),
  ]);
  return evaluateRoleDelegationFromState({ ...input, actorRoleIds, baselineRules, restrictions });
}

module.exports = { evaluateRoleDelegation, evaluateRoleDelegationFromState };
