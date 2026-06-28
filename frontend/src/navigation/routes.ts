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
  ownerWorkerQueues: {
    path: "/owner/system/worker-queues",
    label: "Worker & queues",
    description: "Observabilidad global del runtime operativo.",
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
  { path: "/owner/runtime-section", label: "Runtime", description: "Salud global del worker y colas.", children: [appRoutes.ownerWorkerQueues] },
];

export const ownerNavigation: AppRoute[] = [appRoutes.owner, appRoutes.ownerOrganizations, appRoutes.ownerWorkerQueues, appRoutes.selectOrganization];

export type RouteMetadata = { label: string; parentPath?: string };

export const routeMetadata: Record<string, RouteMetadata> = {
  "/owner": { label: appRoutes.owner.label },
  "/owner/organizations": { label: appRoutes.ownerOrganizations.label, parentPath: appRoutes.owner.path },
  "/owner/system/worker-queues": { label: appRoutes.ownerWorkerQueues.label, parentPath: appRoutes.owner.path },
  "/select-organization": { label: appRoutes.selectOrganization.label, parentPath: appRoutes.owner.path },
  "/account": { label: appRoutes.account.label },
};