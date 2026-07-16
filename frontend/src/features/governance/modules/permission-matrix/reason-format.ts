import type { PermissionMatrixReason, PermissionMatrixReasonCode } from "../../contracts";

const reasonLabels: Record<PermissionMatrixReasonCode, string> = {
  allowed: "Allowed",
  not_canonical: "Not canonical",
  ceiling_not_authorized: "Ceiling not authorized",
  activation_disabled: "Activation disabled",
  policy_denied: "Policy denied",
  delegation_denied: "Delegation denied",
  data_scope_unavailable: "Data scope unavailable",
  authorization_context_stale: "Authorization context stale",
  owning_operation_not_mounted: "Owning operation not mounted",
};

export const reasonLabel = (code: PermissionMatrixReasonCode) => reasonLabels[code] ?? code;
export const reasonToneClass = (code: PermissionMatrixReasonCode) => code === "allowed" ? "text-success-strong" : code === "not_canonical" ? "text-muted-strong" : code === "ceiling_not_authorized" ? "text-warning-strong" : "text-danger-strong";
export const formatSourceVersions = (versions: PermissionMatrixReason["sourceVersions"]) => {
  const entries = Object.entries(versions).filter(([, value]) => Boolean(value));
  return entries.length ? entries.map(([key, value]) => `${key}=${value}`).join(" · ") : "versions unavailable";
};
