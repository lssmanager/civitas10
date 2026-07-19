import type { appRoutes } from "../../navigation/routes";
import type { GovernanceModuleKey, GovernanceSurface } from "./contracts";

export type GovernanceWorkspaceItemId =
  | "role-permissions"
  | "role-names"
  | "scope-assignments"
  | "structure-classification"
  | "groups-courses"
  | "people-segmentation"
  | "access-explorer"
  | "audit-log";

export type GovernanceWorkspaceGroupId = "access-policy" | "organization-model" | "control-evidence";

export type GovernanceWorkspaceItem = {
  id: GovernanceWorkspaceItemId;
  label: string;
  routeKey: keyof typeof appRoutes;
  tenantTab: string;
  moduleKey: GovernanceModuleKey | "unavailable";
  ownerPermissionRequirement: { mode: "all" | "any"; permissions: string[] };
  tenantPermissionRequirement: { mode: "all" | "any"; permissions: string[] };
  actionId: string;
  entity: string;
  endpoint: string;
  sourceOfTruth: string;
  status: "active" | "planned";
};

export type GovernanceWorkspaceGroup = {
  id: GovernanceWorkspaceGroupId;
  label: string;
  items: GovernanceWorkspaceItem[];
};

export const GOVERNANCE_WORKSPACE_GROUPS: GovernanceWorkspaceGroup[] = [
  {
    id: "access-policy",
    label: "Access policy",
    items: [
      { id: "role-permissions", label: "Role permissions", routeKey: "ownerOrganizationGovernanceRoles", tenantTab: "role-permissions", moduleKey: "permissions", ownerPermissionRequirement: { mode: "all", permissions: ["owner.runtime.operations.execute"] }, tenantPermissionRequirement: { mode: "all", permissions: ["org.documents.create"] }, actionId: "governance.rolePermissions.view", entity: "org_role_entitlement_limits", endpoint: "/governance/read-model", sourceOfTruth: "durable governance read model", status: "active" },
      { id: "role-names", label: "Role names", routeKey: "ownerOrganizationGovernanceNavigation", tenantTab: "role-names", moduleKey: "aliases-navigation", ownerPermissionRequirement: { mode: "all", permissions: ["owner.runtime.operations.execute"] }, tenantPermissionRequirement: { mode: "all", permissions: ["org.documents.create"] }, actionId: "governance.roleNames.view", entity: "tenant role aliases", endpoint: "/governance/read-model", sourceOfTruth: "durable governance read model", status: "active" },
      { id: "scope-assignments", label: "Scope assignments", routeKey: "ownerOrganizationGovernanceDataScopes", tenantTab: "scope-assignments", moduleKey: "data-scope", ownerPermissionRequirement: { mode: "all", permissions: ["owner.runtime.operations.execute"] }, tenantPermissionRequirement: { mode: "all", permissions: ["org.documents.create"] }, actionId: "governance.scopeAssignments.view", entity: "authorization_scope_assignments", endpoint: "/governance/read-model", sourceOfTruth: "authorization_scope_assignments", status: "active" },
    ],
  },
  {
    id: "organization-model",
    label: "Organization model",
    items: [
      { id: "structure-classification", label: "Structure and classification", routeKey: "ownerOrganizationGovernanceTaxonomy", tenantTab: "structure-classification", moduleKey: "taxonomy", ownerPermissionRequirement: { mode: "all", permissions: ["owner.runtime.operations.execute"] }, tenantPermissionRequirement: { mode: "all", permissions: ["org.documents.read"] }, actionId: "governance.structureClassification.view", entity: "organization_dimension_values + organization_units", endpoint: "/governance/read-model", sourceOfTruth: "taxonomy and organization structure tables", status: "active" },
      { id: "groups-courses", label: "Groups and courses", routeKey: "ownerOrganizationGovernanceGroups", tenantTab: "groups-courses", moduleKey: "units", ownerPermissionRequirement: { mode: "all", permissions: ["owner.runtime.operations.execute"] }, tenantPermissionRequirement: { mode: "all", permissions: ["lms.groups.read"] }, actionId: "governance.groupsCourses.view", entity: "lms_academic_groups + lms_course_offerings", endpoint: "/o/:organizationId/lms/groups", sourceOfTruth: "LMS group leadership read model", status: "active" },
      { id: "people-segmentation", label: "People segmentation", routeKey: "ownerOrganizationGovernancePeopleSegmentation", tenantTab: "people-segmentation", moduleKey: "unavailable", ownerPermissionRequirement: { mode: "all", permissions: [] }, tenantPermissionRequirement: { mode: "all", permissions: [] }, actionId: "governance.peopleSegmentation.pending", entity: "people segmentation grammar", endpoint: "planned", sourceOfTruth: "pending privacy/grammar ADR", status: "planned" },
    ],
  },
  {
    id: "control-evidence",
    label: "Control and evidence",
    items: [
      { id: "access-explorer", label: "Access explorer", routeKey: "ownerOrganizationGovernancePreview", tenantTab: "access-explorer", moduleKey: "access-preview", ownerPermissionRequirement: { mode: "all", permissions: ["owner.runtime.operations.execute"] }, tenantPermissionRequirement: { mode: "all", permissions: ["org.documents.read"] }, actionId: "governance.accessExplorer.view", entity: "authorization decisions", endpoint: "/governance/access-preview", sourceOfTruth: "server-side authorization evaluator", status: "active" },
      { id: "audit-log", label: "Audit log", routeKey: "ownerOrganizationGovernanceAudit", tenantTab: "audit-log", moduleKey: "audit", ownerPermissionRequirement: { mode: "all", permissions: ["owner.runtime.operations.execute"] }, tenantPermissionRequirement: { mode: "all", permissions: ["org.documents.read"] }, actionId: "governance.auditLog.view", entity: "audit events", endpoint: "/governance/read-model", sourceOfTruth: "audit/outbox read model", status: "active" },
    ],
  },
];

export const flattenGovernanceWorkspaceItems = () => GOVERNANCE_WORKSPACE_GROUPS.flatMap((group) => group.items);

export const governanceWorkspaceItemForSurface = (surface: GovernanceSurface, id: GovernanceWorkspaceItemId) => {
  void surface;
  return flattenGovernanceWorkspaceItems().find((item) => item.id === id) ?? GOVERNANCE_WORKSPACE_GROUPS[0].items[0];
};
