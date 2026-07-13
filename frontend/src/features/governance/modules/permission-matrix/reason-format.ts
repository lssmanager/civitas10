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
};

export const reasonLabel = (code: PermissionMatrixReasonCode) => reasonLabels[code] ?? code;
export const reasonToneClass = (code: PermissionMatrixReasonCode) => code === "allowed" ? "text-emerald-700" : code === "not_canonical" ? "text-slate-700" : code === "ceiling_not_authorized" ? "text-amber-700" : "text-red-700";
export const formatSourceVersions = (versions: PermissionMatrixReason["sourceVersions"]) => {
  const entries = Object.entries(versions).filter(([, value]) => Boolean(value));
  return entries.length ? entries.map(([key, value]) => `${key}=${value}`).join(" · ") : "versions unavailable";
};
