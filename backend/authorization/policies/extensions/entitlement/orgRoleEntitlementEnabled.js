"use strict";
const { allow, deny } = require("../../policyResult");
const { POLICY_REASON_CODES } = require("../../reasonCodes");
const POLICY_ID = "org-role-entitlement-enabled";
module.exports = Object.freeze({ id: POLICY_ID, version: "2026-07-v1", requiredFacts: ["entitlementProvider"], supportedSurfaces: ["organization"], async evaluate(context) {
  const provider = context.providers?.entitlementProvider;
  if (!provider?.evaluate) return deny(POLICY_ID, POLICY_REASON_CODES.POLICY_PROVIDER_MISSING);
  const result = await provider.evaluate({ organizationId: context.principal.organizationId, subject: context.principal.subject, permission: context.authorization.permission, policyVersion: context.authorization.policyVersion });
  if (result.status === "enabled" || result.allowed === true) return allow(POLICY_ID, POLICY_REASON_CODES.AUTHORIZATION_ALLOWED, { policyVersion: result.policyVersion });
  if (result.status === "stale") return deny(POLICY_ID, POLICY_REASON_CODES.AUTHORIZATION_SNAPSHOT_STALE);
  return deny(POLICY_ID, POLICY_REASON_CODES.POLICY_PROVIDER_MISSING);
}});
