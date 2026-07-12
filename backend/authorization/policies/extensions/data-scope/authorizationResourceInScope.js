"use strict";
const { allow, deny } = require("../../policyResult");
const { POLICY_REASON_CODES } = require("../../reasonCodes");
const POLICY_ID = "authorization-resource-in-scope";
module.exports = Object.freeze({ id: POLICY_ID, version: "2026-07-v1", requiredFacts: ["dataScopeProvider"], supportedSurfaces: ["organization"], async evaluate(context) {
  const provider = context.providers?.dataScopeProvider;
  if (!provider?.evaluateResource) return deny(POLICY_ID, POLICY_REASON_CODES.POLICY_PROVIDER_MISSING);
  const result = await provider.evaluateResource({ organizationId: context.principal.organizationId, subject: context.principal.subject, permission: context.authorization.permission, operation: context.request.operation, resource: context.resource });
  return result.allowed === true || result.status === "in_scope" ? allow(POLICY_ID) : deny(POLICY_ID, POLICY_REASON_CODES.RESOURCE_NOT_FOUND_OR_NOT_ACCESSIBLE);
}});
