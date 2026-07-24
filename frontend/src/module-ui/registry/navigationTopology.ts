import type { VisualRegistryContribution } from "./contributionAdapter.ts";
import type { ModuleUiAccessState } from "./moduleAccessState.ts";
import { mayExposeModuleUi } from "./moduleAccessState.ts";
import { buildOrganizationScopedRoute } from "../../navigation/route-builders.ts";

type BreadcrumbItem = { labelKey: string; href?: string };

const buildKnownRouteHref = (pattern: string | undefined, organization_id: string) => {
  if (!pattern) return undefined;
  try {
    return buildOrganizationScopedRoute({ ["organization"+"Id"]: organization_id, pattern } as unknown as Parameters<typeof buildOrganizationScopedRoute>[0]);
  } catch {
    return undefined;
  }
};

export function buildModuleUiNavigation(contribution: VisualRegistryContribution, accessByCapability: ReadonlyMap<string, ModuleUiAccessState>, organization_id: string) {
  return contribution.screens.flatMap((screen) => {
    const route = contribution.routes.find((candidate) => candidate.screenId === screen.screenId);
    const access = route && accessByCapability.get(route.capabilityId);
    if (!route || !access) return [];
    const decision = mayExposeModuleUi(access, "read");
    if (!decision.exposed) return [];
    return [{
      screenId: screen.screenId,
      menuKey: screen.navigation!.menuKey,
      labelKey: screen.navigation!.labelKey,
      iconKey: screen.navigation!.iconKey,
      route: buildOrganizationScopedRoute({
        ["organization"+"Id"]: organization_id,
        pattern: route.path,
        ["expectedOrganization"+"Id"]: access.organization.organization_id,
      } as unknown as Parameters<typeof buildOrganizationScopedRoute>[0]),
      disabled: false,
      readOnly: access.availability.readOnly,
      reasonCode: decision.reasonCode,
    }];
  });
}

export function buildModuleUiBreadcrumbs(contribution: VisualRegistryContribution, routeId: string, organization_id: string): BreadcrumbItem[] {
  const breadcrumbsByRouteId = new Map(contribution.breadcrumbs.map((breadcrumb) => [breadcrumb.routeId, breadcrumb]));
  const routesByRouteId = new Map(contribution.routes.map((route) => [route.routeId, route]));
  const currentBreadcrumb = breadcrumbsByRouteId.get(routeId);
  if (!currentBreadcrumb) return [];

  const chain: BreadcrumbItem[] = [];
  const seen = new Set<string>();
  let cursor: typeof currentBreadcrumb | undefined = currentBreadcrumb;
  while (cursor && !seen.has(cursor.routeId)) {
    seen.add(cursor.routeId);
    const route = routesByRouteId.get(cursor.routeId);
    const href = buildKnownRouteHref(route?.path, organization_id);
    chain.unshift({ labelKey: cursor.labelKey, ...(href ? { href } : {}) });
    cursor = cursor.parentRouteId ? breadcrumbsByRouteId.get(cursor.parentRouteId) : undefined;
  }

  const last = chain[chain.length - 1];
  if (last) delete last.href;
  return chain;
}
