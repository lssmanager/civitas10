import { defineRoute, type DefinedRoute, type RouteParams } from "./route-builders";

export type AppRoute = {
  path: string;
  label: string;
  description?: string;
  route?: DefinedRoute;
  build?: (params?: RouteParams) => string;
};

export type NavigationNode = AppRoute & {
  children?: NavigationNode[];
  structural?: boolean;
};

const staticRoute = (path: string) => defineRoute(path);

const ownerRoute = staticRoute("/owner");
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

const appRoute = (route: DefinedRoute, label: string, description?: string): AppRoute => ({ path: route.pattern, label, description, route, build: route.build });
const structuralRoute = (path: string, label: string, description?: string, children: NavigationNode[] = []): NavigationNode => ({ path, label, description, structural: true, children });

export const appRoutes = {
  owner: appRoute(ownerRoute, "Operational overview", "Estado global del backbone owner y accesos a cada organización."),
  ownerOrganizations: appRoute(ownerOrganizationsRoute, "Directory", "Directorio owner_global de organizaciones canónicas de Logto con señales Civitas."),
  ownerCreateOrganization: appRoute(ownerCreateOrganizationRoute, "Create", "Alta canónica en Logto con bootstrap limpio."),
  ownerOrganizationState: appRoute(ownerOrganizationStateRoute, "Organization detail", "Estado operacional consolidado por organización."),
  ownerOrganizationGovernance: appRoute(ownerOrganizationGovernanceRoute, "Governance", "Studio owner para permisos, ceilings, data scope y contrato visual por organización."),
  tenantGovernance: appRoute(tenantGovernanceRoute, "Governance", "Studio tenant para activaciones, asignaciones y navegación restrictiva dentro de la organización."),
  tenantLmsGrades: appRoute(tenantLmsGradesRoute, "Grades", "Superficie tenant LMS para calificaciones bajo contexto organizacional."),
  ownerLogs: appRoute(ownerLogsRoute, "Audit / diagnostics", "Trazabilidad global de eventos operativos owner."),
  ownerSystem: appRoute(ownerSystemRoute, "Runtime status", "Configuración y salud global del sistema owner."),
  ownerWorkerQueues: appRoute(ownerWorkerQueuesRoute, "Worker queues", "Observabilidad global del runtime operativo."),
  ownerBranding: appRoute(ownerBrandingRoute, "Branding", "Configuración visual y de identidad del entorno."),
  ownerRoleMapping: appRoute(ownerRoleMappingRoute, "Role mappings", "Mapeo de roles y permisos owner a capacidades operativas."),
  ownerPlatformSettings: appRoute(ownerPlatformSettingsRoute, "Platform settings", "Ajustes globales de plataforma owner."),
  selectOrganization: appRoute(selectOrganizationRoute, "Organization detail", "Selector visual de organizaciones reales de Logto."),
  account: appRoute(accountRoute, "Profile", "Resumen del perfil autenticado."),
} as const satisfies Record<string, AppRoute>;

export const primaryNavigation: AppRoute[] = [appRoutes.account];

export const ownerNavigationTree: NavigationNode[] = [
  structuralRoute("/owner/overview-section", "Overview", "Resumen ejecutivo, governance y runtime owner.", [
    appRoutes.owner,
    appRoutes.ownerOrganizationGovernance,
    structuralRoute("/owner/runtime-section", "Worker runtime", "Runtime operativo y diagnóstico.", [appRoutes.ownerSystem, appRoutes.ownerWorkerQueues, appRoutes.ownerLogs]),
  ]),
  structuralRoute("/owner/organizations-section", "Organizations", "Directorio y creación de organizaciones.", [appRoutes.ownerOrganizations, appRoutes.ownerCreateOrganization, appRoutes.ownerOrganizationState]),
  structuralRoute("/owner/settings-section", "Settings", "Configuración owner estable.", [appRoutes.ownerBranding, appRoutes.ownerRoleMapping, appRoutes.ownerPlatformSettings]),
  appRoutes.account,
];

export const tenantNavigationTree: NavigationNode[] = [
  structuralRoute("/tenant/organization-section", "Organization", "Superficie tenant bajo organización seleccionada.", [appRoutes.tenantGovernance, appRoutes.tenantLmsGrades]),
  appRoutes.account,
];

export const ownerNavigation: AppRoute[] = [appRoutes.owner, appRoutes.ownerOrganizationGovernance, appRoutes.ownerSystem, appRoutes.ownerWorkerQueues, appRoutes.ownerLogs, appRoutes.ownerOrganizations, appRoutes.ownerCreateOrganization, appRoutes.ownerOrganizationState, appRoutes.ownerBranding, appRoutes.ownerRoleMapping, appRoutes.ownerPlatformSettings, appRoutes.account];

export type RouteMetadata = { label: string; parentPath?: string };

export const routeMetadata: Record<string, RouteMetadata> = {
  [appRoutes.owner.path]: { label: appRoutes.owner.label, parentPath: "/owner/overview-section" },
  [appRoutes.ownerOrganizationGovernance.path]: { label: appRoutes.ownerOrganizationGovernance.label, parentPath: appRoutes.owner.path },
  [appRoutes.ownerSystem.path]: { label: appRoutes.ownerSystem.label, parentPath: "/owner/runtime-section" },
  [appRoutes.ownerWorkerQueues.path]: { label: appRoutes.ownerWorkerQueues.label, parentPath: appRoutes.ownerSystem.path },
  [appRoutes.ownerLogs.path]: { label: appRoutes.ownerLogs.label, parentPath: appRoutes.ownerSystem.path },
  [appRoutes.ownerOrganizations.path]: { label: appRoutes.ownerOrganizations.label, parentPath: "/owner/organizations-section" },
  [appRoutes.ownerCreateOrganization.path]: { label: appRoutes.ownerCreateOrganization.label, parentPath: appRoutes.ownerOrganizations.path },
  [appRoutes.ownerOrganizationState.path]: { label: appRoutes.ownerOrganizationState.label, parentPath: appRoutes.ownerOrganizations.path },
  [appRoutes.ownerBranding.path]: { label: appRoutes.ownerBranding.label, parentPath: "/owner/settings-section" },
  [appRoutes.ownerRoleMapping.path]: { label: appRoutes.ownerRoleMapping.label, parentPath: "/owner/settings-section" },
  [appRoutes.ownerPlatformSettings.path]: { label: appRoutes.ownerPlatformSettings.label, parentPath: "/owner/settings-section" },
  [appRoutes.account.path]: { label: appRoutes.account.label },
  [appRoutes.tenantGovernance.path]: { label: appRoutes.tenantGovernance.label, parentPath: "/tenant/organization-section" },
  [appRoutes.tenantLmsGrades.path]: { label: appRoutes.tenantLmsGrades.label, parentPath: "/tenant/organization-section" },
};
