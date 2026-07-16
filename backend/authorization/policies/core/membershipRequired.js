"use strict";
const { allow, deny } = require("../policyResult");
const { POLICY_REASON_CODES } = require("../reasonCodes");
const POLICY_ID = "membership-required";
module.exports = Object.freeze({ id: POLICY_ID, version: "2026-07-v1", requiredFacts: ["membershipProvider"], supportedSurfaces: ["organization"], async evaluate(context) {
  const provider = context.providers?.membershipProvider;
  if (!provider?.evaluateMembership) return deny(POLICY_ID, POLICY_REASON_CODES.POLICY_PROVIDER_MISSING);
  const result = await provider.evaluateMembership({ subject: context.principal.subject, organizationId: context.principal.organizationId, tokenIssuedAt: context.principal.tokenIssuedAt, policyVersion: context.authorization.policyVersion });
  if (result.status === "active") return allow(POLICY_ID);
  if (result.status === "revoked") return deny(POLICY_ID, POLICY_REASON_CODES.MEMBERSHIP_REVOKED);
  if (result.status === "stale") return deny(POLICY_ID, POLICY_REASON_CODES.MEMBERSHIP_STALE);
  return deny(POLICY_ID, result.status === "unavailable" ? POLICY_REASON_CODES.MEMBERSHIP_UNAVAILABLE : POLICY_REASON_CODES.MEMBERSHIP_REQUIRED);
}});
