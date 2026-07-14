import type { ActionId, PermissionKey, ScreenId } from "../../authorization/contracts/ids";
import type { VisualDecisionReason } from "../../authorization/contracts/visual-decision";

export type GovernanceSurface = "owner" | "tenant";
export type GovernanceModuleKey = "overview" | "permissions" | "members" | "taxonomy" | "units" | "data-scope" | "aliases-navigation" | "access-preview" | "audit";

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
};

export type PermissionMatrixReasonCode =
  | "allowed"
  | "not_canonical"
  | "ceiling_not_authorized"
  | "activation_disabled"
  | "policy_denied"
  | "delegation_denied"
  | "data_scope_unavailable"
  | "authorization_context_stale";

export type PermissionMatrixReason = {
  code: PermissionMatrixReasonCode;
  sourceVersions: {
    catalogVersion?: string;
    ceilingVersion?: string;
    activationVersion?: string;
    policyVersion?: string;
  };
};

export type GovernancePermissionMatrixRow = {
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

export type GovernanceReadModel = {
  organizationId: string;
  organizationName?: string | null;
  surface: GovernanceSurface;
  versions: GovernanceVersionSummary;
  modules: Partial<Record<GovernanceModuleKey, { status: "ready" | "pending" | "blocked"; reason?: string }>>;
  permissionMatrix: GovernancePermissionMatrixRow[];
  taxonomy: GovernanceTaxonomyItem[];
  units: GovernanceUnitItem[];
  dataScopes: GovernanceDataScopeAssignment[];
  aliasesNavigation: GovernanceAliasNavigationPolicy;
  accessPreviews: GovernanceAccessPreview[];
  auditEvents: GovernanceAuditEvent[];
  diagnostics: string[];
};

export type GovernanceAccessPreviewRequest = { organizationId: string; surface: GovernanceSurface; subjectId: string; actionId?: ActionId; screenId?: ScreenId };
