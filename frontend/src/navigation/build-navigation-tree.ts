import type { VisualAuthorizationContext } from "../authorization/contracts/authorization-context";
import type { IconKey, MenuKey, ScreenId } from "../authorization/contracts/ids";
import type { OrganizationVisualPreference } from "../authorization/contracts/screen-definition";
import { evaluateScreenEligibility, resolveScreenVisibility } from "../authorization/evaluation/evaluate-screen";
import type { VisualRegistry } from "../authorization/registry";

export type ResolvedNavigationItem = { screenId?: ScreenId; menuKey: MenuKey; parentMenuKey?: MenuKey; label: string; labelKey: string; route?: string; iconKey?: IconKey; children: ResolvedNavigationItem[]; customization: { visibility: "locked" | "hideable"; order: "locked" | "customizable" } };

export const buildNavigationTree = (registry: VisualRegistry, context: VisualAuthorizationContext, preferences: readonly OrganizationVisualPreference[] = []): ResolvedNavigationItem[] => {
  const preferenceByScreen = new Map(preferences.filter((preference) => preference.organizationId === context.organizationId).map((preference) => [preference.screenId, preference]));
  const nodes = registry.screens.flatMap((screen) => {
    if (!screen.navigation) return [];
    const decision = resolveScreenVisibility(evaluateScreenEligibility(screen, context), screen, preferenceByScreen.get(screen.screenId));
    if (!decision.visible) return [];
    return [{ screen, order: screen.organizationCustomization.order === "customizable" ? preferenceByScreen.get(screen.screenId)?.order ?? screen.navigation.order ?? 0 : screen.navigation.order ?? 0 }];
  });
  const byKey = new Map<MenuKey, ResolvedNavigationItem>();
  for (const { screen } of nodes) {
    const navigation = screen.navigation!;
    byKey.set(navigation.menuKey, { screenId: screen.screenId, menuKey: navigation.menuKey, parentMenuKey: navigation.parentMenuKey, label: navigation.labelKey.split(".").slice(-1)[0] ?? navigation.labelKey, labelKey: navigation.labelKey, route: screen.route.path, iconKey: navigation.iconKey, children: [], customization: screen.organizationCustomization });
  }
  const roots: ResolvedNavigationItem[] = [];
  for (const item of byKey.values()) {
    if (item.parentMenuKey && byKey.has(item.parentMenuKey)) byKey.get(item.parentMenuKey)!.children.push(item);
    else roots.push(item);
  }
  const orderOf = (item: ResolvedNavigationItem) => nodes.find((node) => node.screen.navigation?.menuKey === item.menuKey)?.order ?? 0;
  const sort = (items: ResolvedNavigationItem[]): ResolvedNavigationItem[] => items.sort((a, b) => orderOf(a) - orderOf(b) || a.menuKey.localeCompare(b.menuKey)).map((item) => ({ ...item, children: sort(item.children) }));
  return sort(roots);
};
