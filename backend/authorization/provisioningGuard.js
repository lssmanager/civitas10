"use strict";
const CANONICAL_ORGANIZATION_ROLE_PREFIX = "organization_";
function provisioningError(code, details = {}) { return Object.assign(new Error(code), { code, safeDetails: details }); }
function assertProvisionedRoleAllowed({ roleName, source = "provisioning" } = {}) {
  if (!roleName || typeof roleName !== "string" || !roleName.startsWith(CANONICAL_ORGANIZATION_ROLE_PREFIX)) throw provisioningError("provisioning_role_not_canonical", { source });
  if (roleName === "owner_global" || roleName.startsWith("owner_")) throw provisioningError("provisioning_owner_role_forbidden", { source });
  return true;
}
function sanitizeExternalProvisioningClaims(claims = {}) {
  const forbiddenKeys = ["permissions", "permission", "scopes", "scope", "actionIds", "action_ids", "ownerCeilings", "owner_ceilings", "tenantActivations", "tenant_activations", "dataScopes", "data_scopes", "owner_global"];
  for (const key of forbiddenKeys) if (Object.prototype.hasOwnProperty.call(claims, key)) throw provisioningError("provisioning_claim_forbidden", { key });
  return { subject: claims.sub || claims.subject || null, email: claims.email || null };
}
function assertVerifiedTenantProvisioningBinding({ organizationId, verified, source } = {}) {
  if (!organizationId || verified !== true) throw provisioningError("provisioning_binding_unverified", { source });
  return true;
}
module.exports = { assertProvisionedRoleAllowed, sanitizeExternalProvisioningClaims, assertVerifiedTenantProvisioningBinding, provisioningError };
