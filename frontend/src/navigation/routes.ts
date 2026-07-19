import type { IconKey } from "../authorization/contracts/ids";
import { defineRoute, type DefinedRoute, type RouteParams } from "./route-builders";

export const OWNER_NAVIGATION_CONTRACT_VERSION = 2;
export const TENANT_NAVIGATION_CONTRACT_VERSION = 1;

export type AppRoute = {
  path: string;
  label: string;
  description?: string;
  route?: DefinedRoute;
  build?: (params?: RouteParams) => string;
  iconKey: IconKey;
  active?: boolean;
};

export type NavigationNode = AppRoute & {
  children?: NavigationNode[];
  structural?: boolean;
};

const staticRoute = (path: string) => defineRoute(path);

const ownerRoute = staticRoute("/owner");
const ownerGovernanceRoute = staticRoute("/owner/governance");
const ownerOrganizationsRoute = staticRoute("/owner/organizations");
const ownerCreateOrganizationRoute = staticRoute("/owner/create");
const ownerOrganizationStateRoute = defineRoute("/owner/organizations/:organizationId");
const ownerOrganizationGovernanceRoute = defineRoute("/owner/organizations/:organizationId/governance");
const ownerOrganizationGovernanceRolesRoute = defineRoute("/owner/organizations/:organizationId/governance/roles");
const ownerOrganizationGovernanceTaxonomyRoute = defineRoute("/owner/organizations/:organizationId/governance/taxonomy");
const ownerOrganizationGovernanceGroupsRoute = defineRoute("/owner/organizations/:organizationId/governance/groups");
const ownerOrganizationGovernanceDataScopesRoute = defineRoute("/owner/organizations/:organizationId/governance/data-scopes");
const ownerOrganizationGovernanceNavigationRoute = defineRoute("/owner/organizations/:organizationId/governance/navigation");
const ownerOrganizationGovernancePreviewRoute = defineRoute("/owner/organizations/:organizationId/governance/preview");
const ownerOrganizationGovernanceAuditRoute = defineRoute("/owner/organizations/:organizationId/governance/audit");
const ownerOrganizationGovernancePeopleSegmentationRoute = defineRoute("/owner/organizations/:organizationId/governance/people-segmentation");
const ownerOrganizationOperationsRoute = defineRoute("/owner/organizations/:organizationId/operations");
const tenantGovernanceRoute = defineRoute("/o/:organizationId/settings/governance");
const tenantLmsGradesRoute = defineRoute("/o/:organizationId/lms/grades");
const tenantLmsGroupsRoute = defineRoute("/o/:organizationId/lms/groups");
const ownerLogsRoute = staticRoute("/owner/logs");
const ownerSystemRoute = staticRoute("/owner/system");
const ownerWorkerQueuesRoute = staticRoute("/owner/system/worker-queues");
const ownerBrandingRoute = staticRoute("/owner/branding");
const ownerRoleMappingRoute = staticRoute("/owner/role-mapping");
const ownerPlatformSettingsRoute = staticRoute("/owner/settings");
const selectOrganizationRoute = staticRoute("/select-organization");
const accountRoute = staticRoute("/account");

const appRoute = (route: DefinedRoute, label: string, iconKey: IconKey, description?: string, active = true): AppRoute => ({ path: route.pattern, label, description, route, build: route.build, iconKey, active });
const structuralRoute = (path: string, label: string, iconKey: IconKey, description?: string, children: NavigationNode[] = [], active = true): NavigationNode => ({ path, label, description, iconKey, active, structural: true, children });

export const appRoutes = {
  owner: appRoute(ownerRoute, "Overview", "overview", "Resumen ejecutivo del backbone owner y accesos a Governance, Operations y Organizations."),
  ownerGovernance: appRoute(ownerGovernanceRoute, "Governance selector", "governance", "Redirects to Directory because Governance requires a selected organization.", false),
  ownerOrganizations: appRoute(ownerOrganizationsRoute, "Directory", "directory", "Directorio owner_global de organizaciones canónicas de Logto con señales Civitas."),
  ownerCreateOrganization: appRoute(ownerCreateOrganizationRoute, "Create", "create", "Alta canónica en Logto con bootstrap limpio."),
  ownerOrganizationState: appRoute(ownerOrganizationStateRoute, "Organization detail", "organizations", "Estado operacional consolidado por organización."),
  ownerOrganizationGovernance: appRoute(ownerOrganizationGovernanceRoute, "Governance", "governance", "Workspace operational contextual para una organización seleccionada."),
  ownerOrganizationGovernanceRoles: appRoute(ownerOrganizationGovernanceRolesRoute, "Role permissions", "governance", "Owner ceiling, tenant activation and permission matrix for the selected organization."),
  ownerOrganizationGovernanceTaxonomy: appRoute(ownerOrganizationGovernanceTaxonomyRoute, "Structure and classification", "governance", "Taxonomy values and organization structure facts for the selected organization."),
  ownerOrganizationGovernanceGroups: appRoute(ownerOrganizationGovernanceGroupsRoute, "Groups and courses", "governance", "LMS group and course read models for the selected organization."),
  ownerOrganizationGovernanceDataScopes: appRoute(ownerOrganizationGovernanceDataScopesRoute, "Data scopes", "governance", "Data-scope assignments for the selected organization."),
  ownerOrganizationGovernanceNavigation: appRoute(ownerOrganizationGovernanceNavigationRoute, "Role names", "governance", "Tenant-facing aliases and navigation preferences for canonical roles."),
  ownerOrganizationGovernancePreview: appRoute(ownerOrganizationGovernancePreviewRoute, "Access explorer", "governance", "Read-only access explorer for the selected organization."),
  ownerOrganizationGovernanceAudit: appRoute(ownerOrganizationGovernanceAuditRoute, "Audit log", "governance", "Audit and diagnostics for the selected organization."),
  ownerOrganizationGovernancePeopleSegmentation: appRoute(ownerOrganizationGovernancePeopleSegmentationRoute, "People segmentation", "governance", "Pending tenant-safe people segmentation grammar and privacy contract.", false),
  ownerOrganizationOperations: appRoute(ownerOrganizationOperationsRoute, "Operations", "operations", "Operational health and capability runtime for the selected organization."),
  tenantGovernance: appRoute(tenantGovernanceRoute, "Governance", "governance", "Studio tenant para activaciones, asignaciones y navegación restrictiva dentro de la organización."),
  tenantLmsGrades: appRoute(tenantLmsGradesRoute, "Grades", "grades", "Superficie tenant LMS para calificaciones bajo contexto organizacional."),
  tenantLmsGroups: appRoute(tenantLmsGroupsRoute, "Groups", "groups", "LMS groups visible through server-side group leadership authorization."),
  ownerLogs: appRoute(ownerLogsRoute, "Audit / diagnostics", "operations", "Trazabilidad global de eventos operativos owner.", false),
  ownerSystem: appRoute(ownerSystemRoute, "Operations", "operations", "Dashboard operativo consolidado para runtime, colas y diagnósticos."),
  ownerWorkerQueues: appRoute(ownerWorkerQueuesRoute, "Worker queues", "operations", "Observabilidad global del runtime operativo.", false),
  ownerBranding: appRoute(ownerBrandingRoute, "Branding", "settings", "Configuración visual y de identidad del entorno.", false),
  ownerRoleMapping: appRoute(ownerRoleMappingRoute, "Role mappings", "settings", "Mapeo de roles y permisos owner a capacidades operativas.", false),
  ownerPlatformSettings: appRoute(ownerPlatformSettingsRoute, "Platform settings", "settings", "Ajustes globales de plataforma owner.", false),
  selectOrganization: appRoute(selectOrganizationRoute, "Organization detail", "organizations", "Selector visual de organizaciones reales de Logto.", false),
  account: appRoute(accountRoute, "Profile", "profile", "Resumen del perfil autenticado.", false),
} as const satisfies Record<string, AppRoute>;

export const primaryNavigation: AppRoute[] = [];

const settingsChildren = [appRoutes.ownerBranding, appRoutes.ownerRoleMapping, appRoutes.ownerPlatformSettings].filter((route) => route.active);

export const ownerNavigationTree: NavigationNode[] = [
  appRoutes.owner,
  appRoutes.ownerSystem,
  structuralRoute("/owner/organizations-section", "Organizations", "organizations", "Directorio y creación de organizaciones.", [appRoutes.ownerOrganizations, appRoutes.ownerCreateOrganization]),
  ...(settingsChildren.length ? [structuralRoute("/owner/settings-section", "Settings", "settings", "Configuración owner estable.", settingsChildren)] : []),
  ...(appRoutes.account.active ? [appRoutes.account] : []),
];

export const tenantNavigationTree: NavigationNode[] = [
  appRoutes.tenantGovernance,
  appRoutes.tenantLmsGrades,
  appRoutes.tenantLmsGroups,
];

export const ownerNavigation: AppRoute[] = [appRoutes.owner, appRoutes.ownerSystem, appRoutes.ownerOrganizations, appRoutes.ownerCreateOrganization];

export type RouteMetadata = { label: string; parentPath?: string };

export const routeMetadata: Record<string, RouteMetadata> = {
  [appRoutes.owner.path]: { label: appRoutes.owner.label },
  [appRoutes.ownerGovernance.path]: { label: appRoutes.ownerGovernance.label, parentPath: appRoutes.ownerOrganizations.path },
  [appRoutes.ownerOrganizationGovernance.path]: { label: appRoutes.ownerOrganizationGovernance.label, parentPath: appRoutes.ownerOrganizationState.path },
  [appRoutes.ownerOrganizationGovernanceRoles.path]: { label: appRoutes.ownerOrganizationGovernanceRoles.label, parentPath: appRoutes.ownerOrganizationGovernance.path },
  [appRoutes.ownerOrganizationGovernanceTaxonomy.path]: { label: appRoutes.ownerOrganizationGovernanceTaxonomy.label, parentPath: appRoutes.ownerOrganizationGovernance.path },
  [appRoutes.ownerOrganizationGovernanceGroups.path]: { label: appRoutes.ownerOrganizationGovernanceGroups.label, parentPath: appRoutes.ownerOrganizationGovernance.path },
  [appRoutes.ownerOrganizationGovernanceDataScopes.path]: { label: appRoutes.ownerOrganizationGovernanceDataScopes.label, parentPath: appRoutes.ownerOrganizationGovernance.path },
  [appRoutes.ownerOrganizationGovernanceNavigation.path]: { label: appRoutes.ownerOrganizationGovernanceNavigation.label, parentPath: appRoutes.ownerOrganizationGovernance.path },
  [appRoutes.ownerOrganizationGovernancePreview.path]: { label: appRoutes.ownerOrganizationGovernancePreview.label, parentPath: appRoutes.ownerOrganizationGovernance.path },
  [appRoutes.ownerOrganizationGovernanceAudit.path]: { label: appRoutes.ownerOrganizationGovernanceAudit.label, parentPath: appRoutes.ownerOrganizationGovernance.path },
  [appRoutes.ownerOrganizationGovernancePeopleSegmentation.path]: { label: appRoutes.ownerOrganizationGovernancePeopleSegmentation.label, parentPath: appRoutes.ownerOrganizationGovernance.path },
  [appRoutes.ownerOrganizationOperations.path]: { label: appRoutes.ownerOrganizationOperations.label, parentPath: appRoutes.ownerOrganizationState.path },
  [appRoutes.ownerSystem.path]: { label: appRoutes.ownerSystem.label },
  [appRoutes.ownerWorkerQueues.path]: { label: appRoutes.ownerWorkerQueues.label, parentPath: appRoutes.ownerSystem.path },
  [appRoutes.ownerLogs.path]: { label: appRoutes.ownerLogs.label, parentPath: appRoutes.ownerSystem.path },
  [appRoutes.ownerOrganizations.path]: { label: appRoutes.ownerOrganizations.label, parentPath: "/owner/organizations-section" },
  [appRoutes.ownerCreateOrganization.path]: { label: appRoutes.ownerCreateOrganization.label, parentPath: appRoutes.ownerOrganizations.path },
  [appRoutes.ownerOrganizationState.path]: { label: appRoutes.ownerOrganizationState.label, parentPath: appRoutes.ownerOrganizations.path },
  [appRoutes.ownerBranding.path]: { label: appRoutes.ownerBranding.label, parentPath: "/owner/settings-section" },
  [appRoutes.ownerRoleMapping.path]: { label: appRoutes.ownerRoleMapping.label, parentPath: "/owner/settings-section" },
  [appRoutes.ownerPlatformSettings.path]: { label: appRoutes.ownerPlatformSettings.label, parentPath: "/owner/settings-section" },
  [appRoutes.account.path]: { label: appRoutes.account.label },
  [appRoutes.tenantGovernance.path]: { label: appRoutes.tenantGovernance.label },
  [appRoutes.tenantLmsGroups.path]: { label: appRoutes.tenantLmsGroups.label },
  [appRoutes.tenantLmsGrades.path]: { label: appRoutes.tenantLmsGrades.label },
};
