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
const tenantGovernanceRoute = defineRoute("/o/:organizationId/settings/governance");
const tenantLmsGradesRoute = defineRoute("/o/:organizationId/lms/grades");
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
  ownerOrganizationGovernance: appRoute(ownerOrganizationGovernanceRoute, "Governance", "governance", "Studio owner contextual para una organización seleccionada."),
  tenantGovernance: appRoute(tenantGovernanceRoute, "Governance", "governance", "Studio tenant para activaciones, asignaciones y navegación restrictiva dentro de la organización."),
  tenantLmsGrades: appRoute(tenantLmsGradesRoute, "Grades", "grades", "Superficie tenant LMS para calificaciones bajo contexto organizacional."),
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
];

export const ownerNavigation: AppRoute[] = [appRoutes.owner, appRoutes.ownerSystem, appRoutes.ownerOrganizations, appRoutes.ownerCreateOrganization];

export type RouteMetadata = { label: string; parentPath?: string };

export const routeMetadata: Record<string, RouteMetadata> = {
  [appRoutes.owner.path]: { label: appRoutes.owner.label },
  [appRoutes.ownerGovernance.path]: { label: appRoutes.ownerGovernance.label, parentPath: appRoutes.ownerOrganizations.path },
  [appRoutes.ownerOrganizationGovernance.path]: { label: appRoutes.ownerOrganizationGovernance.label, parentPath: appRoutes.ownerOrganizationState.path },
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
  [appRoutes.tenantLmsGrades.path]: { label: appRoutes.tenantLmsGrades.label },
};
