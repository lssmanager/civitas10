import type { PermissionMatrixReason, PermissionMatrixReasonCode } from "../../contracts";

const reasonLabels: Record<PermissionMatrixReasonCode | string, string> = {
  allowed: "Allowed",
  not_canonical: "Not canonical",
  ceiling_not_authorized: "Ceiling not authorized",
  activation_disabled: "Activation disabled",
  policy_denied: "Policy denied",
  delegation_denied: "Delegation denied",
  data_scope_unavailable: "Data scope unavailable",
  authorization_context_stale: "Authorization context stale",
  owning_operation_not_mounted: "Capability not available",
  permission_missing: "Permission not available",
  role_permission_missing: "Not granted to this role",
  owner_ceiling_denied: "Blocked by Owner Ceiling",
  owner_ceiling_missing: "No Owner Ceiling decision",
  tenant_activation_missing: "No Tenant Activation decision",
  tenant_activation_denied: "Tenant Activation denied",
  tenant_activation_exceeds_owner_ceiling: "Exceeds Owner Ceiling",
  tenant_activation_locked: "Tenant Activation locked",
};

export const reasonLabel = (code: PermissionMatrixReasonCode | string) => reasonLabels[code] ?? code.replace(/_/g, " ");
export const reasonToneClass = (code: PermissionMatrixReasonCode) => code === "allowed" ? "text-success-strong" : code === "not_canonical" ? "text-muted-strong" : code === "ceiling_not_authorized" ? "text-warning-strong" : "text-danger-strong";
export const formatSourceVersions = (versions: PermissionMatrixReason["sourceVersions"]) => {
  const entries = Object.entries(versions).filter(([, value]) => Boolean(value));
  return entries.length ? entries.map(([key, value]) => `${key}=${value}`).join(" · ") : "versions unavailable";
};
