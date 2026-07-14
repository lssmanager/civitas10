import type { GovernanceModuleKey, GovernanceReadModel, GovernanceVersionSummary } from "../contracts";
import type { StatusPillStatus } from "../../../shared/ui";

export type GovernanceUiState = "ready" | "pending" | "planned" | "unavailable" | "error" | "denied" | "stale" | "empty";

const statusLabels: Record<string, string> = {
  current: "Current",
  pending: "Pending",
  stale: "Stale",
  drift: "Drift detected",
  ready: "Ready",
  blocked: "Unavailable",
  unavailable: "Not available",
  unknown: "Unknown",
};

export const humanizeCode = (value?: string | null) => {
  if (!value) return "Not available";
  return statusLabels[value] ?? value.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const statusTone = (state?: string | null): StatusPillStatus => {
  if (state === "current" || state === "ready" || state === "allowed" || state === "active" || state === "success") return "success";
  if (state === "pending" || state === "planned" || state === "drift" || state === "stale") return "warning";
  if (state === "blocked" || state === "error" || state === "denied" || state === "danger") return "danger";
  return "neutral";
};

export const moduleStatusLabel = (model: GovernanceReadModel, key: GovernanceModuleKey) => humanizeCode(model.modules[key]?.status ?? "pending");
export const moduleStatusTone = (model: GovernanceReadModel, key: GovernanceModuleKey): StatusPillStatus => statusTone(model.modules[key]?.status ?? "pending");

export const versionSummary = (versions: GovernanceVersionSummary) => ({
  catalog: versions.catalogVersion || "unavailable",
  runtime: versions.runtimeStatus || "pending",
  policy: versions.policyVersion || "unavailable",
  taxonomy: versions.taxonomyVersion || "unavailable",
  dataScope: versions.dataScopeVersion || "unavailable",
  visual: versions.visualVersion || "unavailable",
});

export const governanceOverviewMetrics = (model: GovernanceReadModel) => {
  const versions = versionSummary(model.versions);
  const effectivePermissions = model.permissionMatrix.filter((row) => row.effective).length;
  const deniedPermissions = model.permissionMatrix.filter((row) => !row.effective).length;
  const pendingModules = Object.values(model.modules).filter((module) => module?.status === "pending").length;
  const blockedModules = Object.values(model.modules).filter((module) => module?.status === "blocked").length;
  const drift = model.versions.runtimeStatus === "drift" || model.diagnostics.some((diagnostic) => diagnostic.includes("drift"));

  return [
    { label: "Catalog", value: humanizeCode(versions.catalog), detail: versions.catalog === "unavailable" ? "The permission catalog version has not been reported." : "Permission catalog version reported by the read model.", tone: statusTone(versions.catalog === "unavailable" ? "unknown" : "ready") },
    { label: "Runtime", value: humanizeCode(versions.runtime), detail: versions.runtime === "pending" ? "Governance data is still being prepared." : "Latest read-model runtime status.", tone: statusTone(versions.runtime) },
    { label: "Drift", value: drift ? "Needs attention" : "No drift reported", detail: drift ? "Review changes before relying on this snapshot." : "No drift signal was returned for this snapshot.", tone: drift ? "warning" : "success" },
    { label: "Effective permissions", value: String(effectivePermissions), detail: deniedPermissions ? `${deniedPermissions} denied or limited permissions.` : "No denied permissions in the returned matrix.", tone: effectivePermissions ? "success" : "neutral" },
    { label: "Data scopes", value: String(model.dataScopes.length), detail: model.dataScopes.length ? "Configured governed data-scope assignments." : "No data-scope assignments returned yet.", tone: model.dataScopes.length ? "success" : "neutral" },
    { label: "Pending items", value: String(pendingModules + blockedModules), detail: pendingModules || blockedModules ? "Some governance capabilities are pending or unavailable." : "All returned modules are ready.", tone: pendingModules || blockedModules ? "warning" : "success" },
  ] as const;
};

export const configurationCoverage = (model: GovernanceReadModel) => [
  { label: "Roles and permissions", count: model.permissionMatrix.length, tab: "roles-permissions" },
  { label: "Taxonomy values", count: model.taxonomy.length, tab: "taxonomy" },
  { label: "Groups", count: model.units.length, tab: "groups" },
  { label: "Data scopes", count: model.dataScopes.length, tab: "data-scopes" },
  { label: "Aliases", count: model.aliasesNavigation.visualPreferences.length, tab: "aliases-navigation" },
  { label: "Audit events", count: model.auditEvents.length, tab: "audit-diagnostics" },
] as const;

export const governanceDisplayName = (modelOrOrganizationId: GovernanceReadModel | string, fallbackId = "") => typeof modelOrOrganizationId === "string" ? modelOrOrganizationId || "Selected organization" : modelOrOrganizationId.organizationName || fallbackId || modelOrOrganizationId.organizationId || "Selected organization";
