"use strict";
const { allow, deny } = require("../policyResult");
const { POLICY_REASON_CODES } = require("../reasonCodes");
const POLICY_ID = "resource-belongs-to-organization";
module.exports = Object.freeze({ id: POLICY_ID, version: "2026-07-v1", requiredFacts: ["resourceOwnershipProvider"], supportedSurfaces: ["organization"], async evaluate(context) {
  const provider = context.providers?.resourceOwnershipProvider;
  if (!provider?.loadResourceOwnership) return deny(POLICY_ID, POLICY_REASON_CODES.POLICY_PROVIDER_MISSING);
  const result = await provider.loadResourceOwnership({ organizationId: context.principal.organizationId, resourceType: context.resource?.type || context.target?.type, resourceId: context.resource?.id || context.target?.resourceId, resource: context.resource || context.target });
  if (result.status === "belongs") return allow(POLICY_ID);
  if (result.status === "unavailable") return deny(POLICY_ID, POLICY_REASON_CODES.RESOURCE_OWNERSHIP_UNAVAILABLE);
  return deny(POLICY_ID, result.status === "cross_tenant" ? POLICY_REASON_CODES.RESOURCE_ORGANIZATION_MISMATCH : POLICY_REASON_CODES.RESOURCE_NOT_FOUND_OR_NOT_ACCESSIBLE);
}});
