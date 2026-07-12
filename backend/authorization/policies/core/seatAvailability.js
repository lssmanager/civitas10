"use strict";
const { allow, deny } = require("../policyResult");
const { POLICY_REASON_CODES } = require("../reasonCodes");
const POLICY_ID = "seat-availability";
module.exports = Object.freeze({ id: POLICY_ID, version: "2026-07-v1", requiredFacts: ["seatProvider"], supportedSurfaces: ["organization"], async evaluate(context) {
  const provider = context.providers?.seatProvider;
  if (!provider?.evaluateAvailability) return deny(POLICY_ID, POLICY_REASON_CODES.POLICY_PROVIDER_MISSING);
  const result = await provider.evaluateAvailability({ organizationId: context.principal.organizationId, requestedDelta: context.target?.requestedSeatDelta, operation: context.request.operation });
  if (result.status === "available") return allow(POLICY_ID);
  if (result.status === "unavailable") return deny(POLICY_ID, POLICY_REASON_CODES.SEAT_UNAVAILABLE);
  return deny(POLICY_ID, result.status === "provider-unavailable" ? POLICY_REASON_CODES.SEAT_PROVIDER_UNAVAILABLE : POLICY_REASON_CODES.SEAT_STATE_UNKNOWN);
}});
