"use strict";
const { allow, deny } = require("../policyResult");
const { POLICY_REASON_CODES } = require("../reasonCodes");
const POLICY_ID = "feature-enabled";
module.exports = Object.freeze({ id: POLICY_ID, version: "2026-07-v1", requiredFacts: ["featureFlagProvider"], supportedSurfaces: ["owner", "organization", "self"], async evaluate(context) {
  const provider = context.providers?.featureFlagProvider;
  if (!provider?.evaluateFeature) return deny(POLICY_ID, POLICY_REASON_CODES.POLICY_PROVIDER_MISSING);
  const result = await provider.evaluateFeature({ organizationId: context.principal.organizationId, feature: context.target?.feature || context.resource?.feature });
  if (result.status === "enabled") return allow(POLICY_ID);
  if (result.status === "disabled") return deny(POLICY_ID, POLICY_REASON_CODES.FEATURE_DISABLED);
  return deny(POLICY_ID, result.status === "unavailable" ? POLICY_REASON_CODES.FEATURE_PROVIDER_UNAVAILABLE : POLICY_REASON_CODES.FEATURE_STATE_UNKNOWN);
}});
