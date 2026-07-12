"use strict";
const { evaluateOrganizationEntitlement } = require("./entitlementEvaluator");
function createEntitlementPolicyProvider({ repository, roleIdToName = {}, currentPolicyVersion } = {}) {
  return {
    async evaluate({ organizationId, subject, tokenScopes, rolePaths, permission, policyVersion }) {
      return evaluateOrganizationEntitlement({ organizationId, subject, tokenScopes, rolePaths, permission, policyVersion, repository, roleIdToName, currentPolicyVersion });
    },
    async evaluateSnapshot({ organizationId, policyVersion }) {
      if (!repository?.getPolicyVersion) return { status: "unavailable" };
      const current = await repository.getPolicyVersion(organizationId);
      return !policyVersion || Number(policyVersion) >= Number(current) ? { status: "current", policyVersion: current } : { status: "stale", policyVersion: current };
    },
  };
}
module.exports = { createEntitlementPolicyProvider };
