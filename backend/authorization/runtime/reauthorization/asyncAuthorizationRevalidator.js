"use strict";
const REAUTHORIZATION_REASON_CODES = Object.freeze({ SNAPSHOT_STALE: "authorization_snapshot_stale", TARGET_WRONG_TENANT: "authorization_target_wrong_tenant", POLICY_UNAVAILABLE: "authorization_policy_unavailable", ALLOWED: "authorization_revalidated" });
function createAsyncAuthorizationRevalidator({ versionService, policyProvider, targetProvider } = {}) {
  return {
    async reauthorize(input = {}) {
      const current = input.organizationId && versionService ? await versionService.getVersion(input.organizationId) : null;
      if (!current) return { allowed: false, status: "cancelled_authorization_changed", reasonCode: REAUTHORIZATION_REASON_CODES.POLICY_UNAVAILABLE };
      if (String(current.policyVersion) !== String(input.originalPolicyVersion)) return { allowed: false, status: "cancelled_authorization_changed", reasonCode: REAUTHORIZATION_REASON_CODES.SNAPSHOT_STALE, currentPolicyVersion: current.policyVersion };
      const targetDecision = targetProvider?.assertTarget ? await targetProvider.assertTarget(input.target, input) : { allowed: true };
      if (!targetDecision.allowed) return { allowed: false, status: "cancelled_authorization_changed", reasonCode: targetDecision.reasonCode || REAUTHORIZATION_REASON_CODES.TARGET_WRONG_TENANT };
      const policyDecision = policyProvider?.authorize ? await policyProvider.authorize(input) : { allowed: true };
      if (!policyDecision.allowed) return { allowed: false, status: "cancelled_authorization_changed", reasonCode: policyDecision.reasonCode || REAUTHORIZATION_REASON_CODES.POLICY_UNAVAILABLE };
      return { allowed: true, status: "authorized", reasonCode: REAUTHORIZATION_REASON_CODES.ALLOWED, currentPolicyVersion: current.policyVersion };
    },
  };
}
module.exports = { createAsyncAuthorizationRevalidator, REAUTHORIZATION_REASON_CODES };
