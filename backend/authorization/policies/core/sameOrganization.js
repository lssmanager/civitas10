"use strict";
const { allow, deny } = require("../policyResult");
const { POLICY_REASON_CODES } = require("../reasonCodes");
const POLICY_ID = "same-organization";
module.exports = Object.freeze({ id: POLICY_ID, version: "2026-07-v1", requiredFacts: [], supportedSurfaces: ["organization"], async evaluate(context) {
  const principalOrg = context.principal.organizationId;
  const routeOrg = context.request.routeOrganizationId;
  const targetOrg = context.target?.organizationId;
  const resourceOrg = context.resource?.organizationId;
  if (!principalOrg) return deny(POLICY_ID, POLICY_REASON_CODES.ORGANIZATION_CONTEXT_MISSING);
  if (routeOrg && routeOrg !== principalOrg) return deny(POLICY_ID, POLICY_REASON_CODES.ORGANIZATION_ROUTE_MISMATCH);
  if (targetOrg && targetOrg !== principalOrg) return deny(POLICY_ID, POLICY_REASON_CODES.RESOURCE_ORGANIZATION_MISMATCH);
  if (resourceOrg && resourceOrg !== principalOrg) return deny(POLICY_ID, POLICY_REASON_CODES.RESOURCE_ORGANIZATION_MISMATCH);
  return allow(POLICY_ID);
}});
