"use strict";
const { allow, deny } = require("../../policyResult");
const { POLICY_REASON_CODES } = require("../../reasonCodes");
const POLICY_ID = "org-role-entitlement-enabled";
module.exports = Object.freeze({ id: POLICY_ID, version: "2026-07-v2", requiredFacts: ["entitlementProvider"], supportedSurfaces: ["organization"], async evaluate(context) {
  const provider = context.providers?.entitlementProvider;
  if (!provider?.evaluate) return deny(POLICY_ID, POLICY_REASON_CODES.POLICY_PROVIDER_MISSING);
  const result = await provider.evaluate({ organizationId: context.principal.organizationId, subject: context.principal.subject, tokenScopes: context.principal.scopes, rolePaths: context.rolePaths, permission: context.authorization.permission, policyVersion: context.authorization.policyVersion });
  for (const path of context.rolePaths) {
    const evaluated = (result.evaluatedRolePaths || []).find((candidate) => candidate.rolePathId === path.rolePathId);
    if (evaluated) path.entitlementDecision = { allowed: evaluated.allowed, policyVersion: result.policyVersion, reasonCode: evaluated.reasonCode };
  }
  if (result.allowed === true) return allow(POLICY_ID, POLICY_REASON_CODES.AUTHORIZATION_ALLOWED, { policyVersion: result.policyVersion, rolePathId: result.matchedRolePathId });
  if (result.reasonCode === POLICY_REASON_CODES.AUTHORIZATION_SNAPSHOT_STALE || result.reasonCode === "authorization_snapshot_stale") return deny(POLICY_ID, POLICY_REASON_CODES.AUTHORIZATION_SNAPSHOT_STALE);
  return deny(POLICY_ID, result.reasonCode || POLICY_REASON_CODES.POLICY_PROVIDER_MISSING);
}});
