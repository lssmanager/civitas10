import type { ActionId, PermissionKey, ScreenId } from "../../authorization/contracts/ids";
import type { VisualDecisionReason } from "../../authorization/contracts/visual-decision";

export type GovernanceSurface = "owner" | "tenant";
export type GovernanceModuleKey = "overview" | "permissions" | "members" | "taxonomy" | "units" | "data-scope" | "aliases-navigation" | "access-preview" | "audit";

export const GOVERNANCE_READ_MODEL_CONTRACT_VERSION = "2026-07-civitas10-governance-read-model-v1" as const;
export const GOVERNANCE_OPERATION_REGISTRY_VERSION = "2026-07-civitas10-governance-operations-v1" as const;

export type GovernanceVersionSummary = {
  catalogVersion: string;
  ceilingVersion?: string;
  activationVersion?: string;
  dataScopeVersion?: string;
  taxonomyVersion?: string;
  unitsVersion?: string;
  visualVersion?: string;
  policyVersion?: string;
  runtimeStatus?: "current" | "pending" | "stale" | "drift";
  readModelVersion?: string;
  operationRegistryVersion?: string;
};

export type PermissionMatrixReasonCode =
  | "allowed"
  | "not_canonical"
  | "ceiling_not_authorized"
  | "activation_disabled"
  | "policy_denied"
  | "delegation_denied"
  | "data_scope_unavailable"
  | "authorization_context_stale"
  | "owning_operation_not_mounted";

export type PermissionMatrixReason = {
  code: PermissionMatrixReasonCode;
  sourceVersions: {
    catalogVersion?: string;
    ceilingVersion?: string;
    activationVersion?: string;
    policyVersion?: string;
  };
};

export type GovernanceRoleSummary = { id: string; canonicalKey: string; displayName: string; assignedMemberCount: number; potentialPermissions: PermissionKey[]; ceilingCoverage: number };
export type GovernanceMemberSummary = { id: string; display: string; roleIds: string[]; roleAliases: string[]; dataScopeSummary: string; allowedAssignmentActions: string[] };

export type GovernancePermissionMatrixRow = {
  roleId?: string;
  roleKey?: string;
  permission: PermissionKey;
  canonical: boolean;
  rolePotential: boolean | null;
  ownerAllowed: boolean | null;
  tenantEnabled: boolean | null;
  effective: boolean;
  reason: PermissionMatrixReason;
};

export type GovernanceTaxonomyItem = { id: string; dimension: string; label: string; status: "active" | "archived"; assignable: boolean };
export type GovernanceUnitItem = { id: string; label: string; parentId?: string; status: "active" | "archived"; memberCount?: number };
export type GovernanceDataScopeAssignment = { principalId: string; capability: string; taxonomyIds: string[]; unitIds: string[]; resourceSummary: string; effective: boolean; reason: string };
export type GovernanceAliasNavigationPolicy = { aliasesTenantEditable: boolean; navigationTenantEditable: boolean; visualPreferences: Array<{ screenId: ScreenId; hidden?: boolean; order?: number; locked: boolean }> };
export type GovernanceAccessPreview = { subjectId: string; actionId?: ActionId; screenId?: ScreenId; decision: { allowed: boolean; reason: VisualDecisionReason | PermissionMatrixReasonCode | string; sourceVersions: PermissionMatrixReason["sourceVersions"] } };
export type GovernanceAuditEvent = { id: string; actorId: string; organizationId: string; target: string; action: string; before?: unknown; after?: unknown; reason: string; contractVersion: string; createdAt: string };

export type GovernanceModuleStatus = "active" | "planned" | "unavailable" | "denied" | "stale" | "error" | "ready" | "pending" | "blocked";
export type GovernanceReadModel = {
  contractVersion?: typeof GOVERNANCE_READ_MODEL_CONTRACT_VERSION;
  generatedAt?: string;
  organization?: { logtoOrganizationId: string | null; name?: string | null; surface?: GovernanceSurface };
  organizationId: string;
  organizationName?: string | null;
  surface: GovernanceSurface;
  versions: GovernanceVersionSummary;
  runtimeStatus?: "current" | "pending" | "stale" | "drift";
  modules: Partial<Record<GovernanceModuleKey, { status: GovernanceModuleStatus; reason?: string; dependencyVersions?: GovernanceVersionSummary }>>;
  roles?: GovernanceRoleSummary[];
  members?: GovernanceMemberSummary[];
  operationRegistry?: { registryVersion: string; operations: Array<Record<string, unknown>> };
  moduleInventory?: Array<Record<string, unknown>>;
  summary?: Record<string, unknown>;
  permissionMatrix: GovernancePermissionMatrixRow[];
  taxonomy: GovernanceTaxonomyItem[];
  units: GovernanceUnitItem[];
  dataScopes: GovernanceDataScopeAssignment[];
  aliasesNavigation: GovernanceAliasNavigationPolicy;
  accessPreviews: GovernanceAccessPreview[];
  auditSummary?: Record<string, unknown>;
  auditEvents: GovernanceAuditEvent[];
  diagnostics: Array<string | { code: string; severity?: string; message?: string }>;
};

export type GovernanceAccessPreviewRequest = { organizationId: string; surface: GovernanceSurface; subjectId: string; actionId?: ActionId; screenId?: ScreenId };


const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const fail = (path: string, version: string | null, reason: string) => ({ ok: false as const, path, version, reason });
export type GovernanceContractValidation = { ok: true; value: GovernanceReadModel } | { ok: false; path: string; version: string | null; reason: string };

export const validateGovernanceReadModel = (value: unknown): GovernanceContractValidation => {
  const version = isRecord(value) && typeof value.contractVersion === "string" ? value.contractVersion : null;
  if (!isRecord(value)) return fail("$", version, "response must be an object");
  if (value.contractVersion !== GOVERNANCE_READ_MODEL_CONTRACT_VERSION) return fail("$.contractVersion", version, `unsupported contract version; expected ${GOVERNANCE_READ_MODEL_CONTRACT_VERSION}`);
  if (typeof value.generatedAt !== "string") return fail("$.generatedAt", version, "generatedAt must be a string");
  if (!isRecord(value.organization)) return fail("$.organization", version, "organization must be an object");
  if (value.surface !== "owner" && value.surface !== "tenant") return fail("$.surface", version, "surface must be owner or tenant");
  if (!isRecord(value.versions)) return fail("$.versions", version, "versions must be an object");
  if (typeof value.versions.catalogVersion !== "string") return fail("$.versions.catalogVersion", version, "catalogVersion must be a string");
  if (!["current", "pending", "stale", "drift"].includes(String(value.runtimeStatus))) return fail("$.runtimeStatus", version, "runtimeStatus must be current, pending, stale or drift");
  if (!isRecord(value.modules)) return fail("$.modules", version, "modules must be an object");
  if (!isRecord(value.operationRegistry)) return fail("$.operationRegistry", version, "operationRegistry must be an object");
  if (!Array.isArray(value.operationRegistry.operations)) return fail("$.operationRegistry.operations", version, "operationRegistry.operations must be an array");
  for (const [key, module] of Object.entries(value.modules)) {
    if (!isRecord(module)) return fail(`$.modules.${key}`, version, "module must be an object");
    if (!["active", "planned", "unavailable", "denied", "stale", "error", "ready", "pending", "blocked"].includes(String(module.status))) return fail(`$.modules.${key}.status`, version, "module status is invalid");
    if (module.reason !== undefined && typeof module.reason !== "string") return fail(`$.modules.${key}.reason`, version, "module reason must be a string");
  }
  if (value.roles !== undefined && !Array.isArray(value.roles)) return fail("$.roles", version, "roles must be an array");
  if (value.members !== undefined && !Array.isArray(value.members)) return fail("$.members", version, "members must be an array");
  for (const key of ["permissionMatrix", "taxonomy", "units", "dataScopes", "accessPreviews", "auditEvents", "diagnostics"] as const) if (!Array.isArray(value[key])) return fail(`$.${key}`, version, `${key} must be an array`);
  if (!isRecord(value.aliasesNavigation)) return fail("$.aliasesNavigation", version, "aliasesNavigation must be an object");
  return { ok: true, value: value as GovernanceReadModel };
};
