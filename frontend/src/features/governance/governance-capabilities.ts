import type { GovernanceModuleKey, GovernanceSurface } from "./contracts";

export type GovernanceOperationKey = "governance.readModel" | "governance.accessPreview";
export type GovernanceEffectiveStatus = "active" | "planned" | "disabled" | "unavailable";

export type GovernanceOperationContract = {
  operation: GovernanceOperationKey;
  surface: GovernanceSurface;
  status: GovernanceEffectiveStatus;
  endpoint?: string;
  reason: string;
};

export const governanceOperationRegistry: readonly GovernanceOperationContract[] = Object.freeze([
  { operation: "governance.readModel", surface: "owner", status: "unavailable", reason: "No active backend handler is mounted for the owner governance aggregate read model in this branch." },
  { operation: "governance.readModel", surface: "tenant", status: "unavailable", reason: "No active backend handler is mounted for the tenant governance aggregate read model in this branch." },
  { operation: "governance.accessPreview", surface: "owner", status: "unavailable", reason: "No active backend handler is mounted for read-only owner access preview in this branch." },
  { operation: "governance.accessPreview", surface: "tenant", status: "unavailable", reason: "No active backend handler is mounted for read-only tenant access preview in this branch." },
]);

export const governanceModuleStatus = (surface: GovernanceSurface): Record<GovernanceModuleKey, { status: "pending" | "blocked"; reason: string }> => {
  const readModel = governanceOperationRegistry.find((entry) => entry.operation === "governance.readModel" && entry.surface === surface);
  const reason = readModel?.reason ?? "Governance operation is not active.";
  const ownerModules: GovernanceModuleKey[] = ["overview", "permissions", "taxonomy", "units", "data-scope", "aliases-navigation", "access-preview", "audit"];
  const tenantModules: GovernanceModuleKey[] = ["permissions", "members", "data-scope", "taxonomy", "units", "aliases-navigation", "access-preview"];
  return Object.fromEntries((surface === "owner" ? ownerModules : tenantModules).map((key) => [key, { status: "pending", reason }])) as Record<GovernanceModuleKey, { status: "pending" | "blocked"; reason: string }>;
};

export const isGovernanceOperationActive = (surface: GovernanceSurface, operation: GovernanceOperationKey) => governanceOperationRegistry.some((entry) => entry.surface === surface && entry.operation === operation && entry.status === "active");
