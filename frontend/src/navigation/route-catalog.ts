import { appRoutes } from "./routes";
import type { RouteReference } from "../authorization/contracts/screen-definition";
import type { RouteId } from "../authorization/contracts/ids";

const route = (routeId: string, path: string, scope: RouteReference["scope"]): RouteReference => ({ routeId: routeId as RouteId, path, scope });

export const routeCatalog = {
  ownerOverview: route("owner.overview", appRoutes.owner.path, "owner"),
  ownerOrganizations: route("owner.organizations", appRoutes.ownerOrganizations.path, "owner"),
  ownerCreateOrganization: route("owner.organizations.create", appRoutes.ownerCreateOrganization.path, "owner"),
  ownerOrganizationState: route("owner.organizations.state", appRoutes.ownerOrganizationState.path, "owner"),
  ownerOrganizationGovernance: route("owner.organizations.governance", appRoutes.ownerOrganizationGovernance.path, "owner"),
  ownerSystem: route("owner.system", appRoutes.ownerSystem.path, "owner"),
  ownerWorkerQueues: route("owner.system.worker_queues", appRoutes.ownerWorkerQueues.path, "owner"),
  account: route("account.profile", appRoutes.account.path, "account"),
  tenantGovernance: route("tenant.settings.governance", appRoutes.tenantGovernance.path, "tenant"),
  lmsGrades: route("tenant.lms.grades", appRoutes.tenantLmsGrades.path, "tenant"),
} as const;
