"use strict";
const FEATURE_REASON_CODES = Object.freeze({ GLOBAL_DISABLED: "feature_global_disabled", ROLLOUT_DENIED: "feature_rollout_denied", ORG_DISABLED: "feature_org_disabled", UNKNOWN: "feature_unknown", STATE_UNAVAILABLE: "feature_state_unavailable", SNAPSHOT_STALE: "feature_snapshot_stale", ALLOWED: "feature_available" });
function deny(reasonCode, details = {}) { return { available: false, reasonCode, ...details }; }
function createFeatureAvailabilityResolver({ featureStateProvider, versionService } = {}) {
  return {
    async resolve(input = {}) {
      if (!input.featureKey) return deny(FEATURE_REASON_CODES.UNKNOWN);
      let snapshot = null;
      try { snapshot = input.organizationId && versionService ? await versionService.getVersion(input.organizationId) : null; } catch { return deny(FEATURE_REASON_CODES.STATE_UNAVAILABLE); }
      if (input.organizationId && (!snapshot || String(snapshot.policyVersion) !== String(input.policyVersion))) return deny(FEATURE_REASON_CODES.SNAPSHOT_STALE, { currentPolicyVersion: snapshot?.policyVersion });
      let state;
      try { state = await featureStateProvider.getFeatureState({ featureKey: input.featureKey, organizationId: input.organizationId, actor: input.actor }); } catch { return deny(FEATURE_REASON_CODES.STATE_UNAVAILABLE); }
      if (!state || state.status === "unknown") return deny(FEATURE_REASON_CODES.UNKNOWN);
      if (state.killSwitch || state.globalEnabled === false) return deny(FEATURE_REASON_CODES.GLOBAL_DISABLED);
      if (state.rolloutAllowed === false) return deny(FEATURE_REASON_CODES.ROLLOUT_DENIED);
      if (state.organizationOverride === "disabled") return deny(FEATURE_REASON_CODES.ORG_DISABLED);
      if (state.organizationOverride === "enabled") return deny(FEATURE_REASON_CODES.ORG_DISABLED, { detail: "tenant_override_disable_only" });
      if (state.scopePresent === false || state.entitlementAllowed === false || state.contextualPoliciesAllowed === false) return deny(FEATURE_REASON_CODES.ROLLOUT_DENIED);
      return { available: true, reasonCode: FEATURE_REASON_CODES.ALLOWED, policyVersion: snapshot?.policyVersion || String(input.policyVersion) };
    },
  };
}
module.exports = { createFeatureAvailabilityResolver, FEATURE_REASON_CODES };
