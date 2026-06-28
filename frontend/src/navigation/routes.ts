export type AppRoute = {
  path: string;
  label: string;
  description?: string;
};

export type NavigationNode = AppRoute & {
  children?: AppRoute[];
};

export const appRoutes = {
  owner: {
    path: "/owner",
    label: "Operational Overview",
    description: "Estado global del backbone owner y accesos a cada organización.",
  },
  ownerOrganizations: {
    path: "/owner/organizations",
    label: "Create organization",
    description: "Alta canónica en Logto con bootstrap limpio.",
  },
  ownerOrganizationState: {
    path: "/owner/organizations/:organizationId",
    label: "Organization state",
    description: "Estado operacional consolidado por organización.",
  },
  ownerLogs: {
    path: "/owner/logs",
    label: "Audit logs",
    description: "Trazabilidad global de eventos operativos owner.",
  },
  ownerSystem: {
    path: "/owner/system",
    label: "System",
    description: "Configuración y salud global del sistema owner.",
  },
  ownerWorkerQueues: {
    path: "/owner/system/worker-queues",
    label: "Worker & queues",
    description: "Observabilidad global del runtime operativo.",
  },
  ownerBranding: {
    path: "/owner/branding",
    label: "Branding",
    description: "Configuración visual y de identidad del entorno.",
  },
  ownerRoleMapping: {
    path: "/owner/role-mapping",
    label: "Role mapping",
    description: "Mapeo de roles y permisos owner a capacidades operativas.",
  },
  selectOrganization: {
    path: "/select-organization",
    label: "Select organization",
    description: "Selector visual de organizaciones reales de Logto.",
  },
  account: {
    path: "/account",
    label: "Account",
    description: "Resumen del perfil autenticado.",
  },
} as const satisfies Record<string, AppRoute>;

export const primaryNavigation: AppRoute[] = [appRoutes.account];

export const ownerNavigationTree: NavigationNode[] = [
  appRoutes.owner,
  { path: "/owner/organizations-section", label: "Organizations", description: "Creación y estado operacional por organización.", children: [appRoutes.ownerOrganizations, appRoutes.selectOrganization] },
  { path: "/owner/runtime-section", label: "Runtime", description: "Salud global del worker y colas.", children: [appRoutes.ownerSystem, appRoutes.ownerWorkerQueues, appRoutes.ownerLogs] },
  { path: "/owner/configuration-section", label: "Configuration", description: "Branding y mapeo de roles del tenant owner.", children: [appRoutes.ownerBranding, appRoutes.ownerRoleMapping] },
];

export const ownerNavigation: AppRoute[] = [appRoutes.owner, appRoutes.ownerOrganizations, appRoutes.ownerSystem, appRoutes.ownerWorkerQueues, appRoutes.ownerLogs, appRoutes.ownerBranding, appRoutes.ownerRoleMapping, appRoutes.selectOrganization];

export type RouteMetadata = { label: string; parentPath?: string };

export const routeMetadata: Record<string, RouteMetadata> = {
  "/owner": { label: appRoutes.owner.label },
  "/owner/organizations": { label: appRoutes.ownerOrganizations.label, parentPath: appRoutes.owner.path },
  "/owner/logs": { label: appRoutes.ownerLogs.label, parentPath: appRoutes.owner.path },
  "/owner/system": { label: appRoutes.ownerSystem.label, parentPath: appRoutes.owner.path },
  "/owner/system/worker-queues": { label: appRoutes.ownerWorkerQueues.label, parentPath: appRoutes.ownerSystem.path },
  "/owner/branding": { label: appRoutes.ownerBranding.label, parentPath: appRoutes.owner.path },
  "/owner/role-mapping": { label: appRoutes.ownerRoleMapping.label, parentPath: appRoutes.owner.path },
  "/select-organization": { label: appRoutes.selectOrganization.label, parentPath: appRoutes.owner.path },
  "/account": { label: appRoutes.account.label },
};
