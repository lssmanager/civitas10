"use strict";
function createEntitlementBaselineService({ entitlementService } = {}) {
  if (!entitlementService) throw new Error("entitlement_service_required");
  return {
    async applyBaselineProfile({ organizationId, expectedPolicyVersion, profile, actorLogtoUserId, reason, decisionId } = {}) {
      if (!profile || !Array.isArray(profile.changes) || !profile.name) throw Object.assign(new Error("authorization_baseline_profile_required"), { code: "authorization_baseline_profile_required" });
      return entitlementService.upsertOwnerLimits({ organizationId, expectedPolicyVersion, changes: profile.changes, actorLogtoUserId, reason: reason || `baseline:${profile.name}`, decisionId });
    },
    planBaselineProfile({ organizationId, profile } = {}) { return { organizationId, status: "authorization_pending", profileName: profile?.name || null, changes: Array.isArray(profile?.changes) ? profile.changes.length : 0, applyRequired: true }; },
  };
}
module.exports = { createEntitlementBaselineService };
