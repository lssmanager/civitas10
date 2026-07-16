"use strict";
const { allow, deny } = require("../../policyResult");
const { POLICY_REASON_CODES } = require("../../reasonCodes");
const POLICY_ID = "authorization-snapshot-current";
module.exports = Object.freeze({ id: POLICY_ID, version: "2026-07-v1", requiredFacts: ["entitlementProvider"], supportedSurfaces: ["owner", "organization", "self"], async evaluate(context) {
  const provider = context.providers?.entitlementProvider;
  if (!provider?.evaluateSnapshot) return deny(POLICY_ID, POLICY_REASON_CODES.POLICY_PROVIDER_MISSING);
  const result = await provider.evaluateSnapshot({ subject: context.principal.subject, organizationId: context.principal.organizationId, policyVersion: context.authorization.policyVersion });
  return result.status === "current" ? allow(POLICY_ID) : deny(POLICY_ID, POLICY_REASON_CODES.AUTHORIZATION_SNAPSHOT_STALE);
}});
