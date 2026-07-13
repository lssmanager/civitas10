import type { VisualRegistry } from "../authorization/registry";
export type ResolvedBreadcrumb = { labelKey: string; route: string };
export const buildBreadcrumbs = (registry: VisualRegistry, pathname: string): ResolvedBreadcrumb[] => registry.screens.filter((screen) => screen.navigation && (screen.route.path === pathname || screen.route.path.includes(":"))).filter((screen) => screen.route.path === pathname || new RegExp(`^${screen.route.path.replace(/:[^/]+/g, "[^/]+")}$`).test(pathname)).map((screen) => ({ labelKey: screen.navigation!.breadcrumbKey, route: screen.route.path }));
