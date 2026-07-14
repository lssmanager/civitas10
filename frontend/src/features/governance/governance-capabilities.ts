import type { GovernanceModuleKey, GovernanceSurface } from "./contracts";
import { GOVERNANCE_OPERATION_REGISTRY_VERSION, GOVERNANCE_READ_MODEL_CONTRACT_VERSION } from "./contracts";

export type GovernanceOperationKey = "governance.readModel" | "governance.accessPreview";
export type GovernanceEffectiveStatus = "active" | "planned" | "disabled" | "unavailable";

export type GovernanceOperationContract = {
  operationId: GovernanceOperationKey;
  operation: GovernanceOperationKey;
  method: "GET" | "POST";
  pattern: string;
  surface: GovernanceSurface;
  permission: string;
  policies: string[];
  status: GovernanceEffectiveStatus;
  contractVersion: string;
  responseSchema: string;
  reason: string;
};

export const governanceOperationRegistryVersion = GOVERNANCE_OPERATION_REGISTRY_VERSION;
export const governanceOperationRegistry: readonly GovernanceOperationContract[] = Object.freeze([
  { operationId: "governance.readModel", operation: "governance.readModel", method: "GET", pattern: "/owner/organizations/{organizationId}/governance", surface: "owner", permission: "owner.profile.read", policies: ["owner_global"], status: "active", contractVersion: GOVERNANCE_READ_MODEL_CONTRACT_VERSION, responseSchema: "GovernanceReadModel", reason: "Mounted read-only owner governance aggregate." },
  { operationId: "governance.readModel", operation: "governance.readModel", method: "GET", pattern: "/o/{organizationId}/governance", surface: "tenant", permission: "org.documents.read", policies: ["same-organization", "organization_member"], status: "active", contractVersion: GOVERNANCE_READ_MODEL_CONTRACT_VERSION, responseSchema: "GovernanceReadModel", reason: "Mounted read-only tenant governance aggregate." },
  { operationId: "governance.accessPreview", operation: "governance.accessPreview", method: "POST", pattern: "/owner/organizations/{organizationId}/access-preview", surface: "owner", permission: "governance.preview.read", policies: ["authorization-snapshot-current"], status: "unavailable", contractVersion: "not_mounted", responseSchema: "GovernanceAccessPreview", reason: "Read-only access preview handler is not mounted in this branch." },
  { operationId: "governance.accessPreview", operation: "governance.accessPreview", method: "POST", pattern: "/o/{organizationId}/access-preview", surface: "tenant", permission: "governance.preview.read", policies: ["same-organization", "authorization-snapshot-current"], status: "unavailable", contractVersion: "not_mounted", responseSchema: "GovernanceAccessPreview", reason: "Read-only access preview handler is not mounted in this branch." },
]);

export const governanceModuleStatus = (surface: GovernanceSurface): Record<GovernanceModuleKey, { status: "active" | "planned" | "unavailable"; reason: string }> => {
  const readModel = governanceOperationRegistry.find((entry) => entry.operation === "governance.readModel" && entry.surface === surface);
  const reason = readModel?.reason ?? "Governance operation is not active.";
  const ownerModules: GovernanceModuleKey[] = ["overview", "permissions", "taxonomy", "units", "data-scope", "aliases-navigation", "access-preview", "audit"];
  const tenantModules: GovernanceModuleKey[] = ["permissions", "members", "data-scope", "taxonomy", "units", "aliases-navigation", "access-preview"];
  return Object.fromEntries((surface === "owner" ? ownerModules : tenantModules).map((key) => [key, { status: key === "access-preview" ? "planned" : readModel?.status === "active" ? "active" : "unavailable", reason }])) as Record<GovernanceModuleKey, { status: "active" | "planned" | "unavailable"; reason: string }>;
};

export const isGovernanceOperationActive = (surface: GovernanceSurface, operation: GovernanceOperationKey) => governanceOperationRegistry.some((entry) => entry.surface === surface && entry.operation === operation && entry.status === "active");
