"use strict";
const { allow, deny } = require("../policyResult");
const { POLICY_REASON_CODES } = require("../reasonCodes");
const POLICY_ID = "connector-enabled";
module.exports = Object.freeze({ id: POLICY_ID, version: "2026-07-v1", requiredFacts: ["connectorProvider"], supportedSurfaces: ["organization"], async evaluate(context) {
  const provider = context.providers?.connectorProvider;
  if (!provider?.isCapabilityEnabled) return deny(POLICY_ID, POLICY_REASON_CODES.POLICY_PROVIDER_MISSING);
  const result = await provider.isCapabilityEnabled({ organizationId: context.principal.organizationId, capability: context.target?.capability || context.resource?.capability });
  if (result.status === "enabled") return allow(POLICY_ID);
  if (result.status === "disabled") return deny(POLICY_ID, POLICY_REASON_CODES.CONNECTOR_DISABLED);
  return deny(POLICY_ID, result.status === "unavailable" ? POLICY_REASON_CODES.CONNECTOR_STATE_UNAVAILABLE : POLICY_REASON_CODES.CONNECTOR_STATE_UNKNOWN);
}});
