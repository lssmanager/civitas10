import type { VisualRegistry } from "./compile-visual-registry";
import { activePermissions, knownCapabilities, knownFeatureFlags, knownIcons, knownPolicies } from "./catalogs";
import type { MenuKey } from "../contracts/ids";

const legacyPermission = /:|^organization\.|^impersonation\.|^runtime:|^worker-queues:/;
const roleOrTaxonomy = /(organization_(admin|teacher|headdirector)|owner_global|primary|elementary|mathematics|social-studies|billing-department|moodle|freescout|listmonk|calcom)/i;

export const validateVisualRegistry = (registry: Pick<VisualRegistry, "screens" | "actions">): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const seenScreens = new Set<string>();
  const seenActions = new Set<string>();
  const seenMenuKeys = new Set<string>();
  const seenRoutes = new Map<string, string>();
  const parentLinks = new Map<string, string>();

  for (const action of registry.actions) {
    if (seenActions.has(action.actionId)) errors.push(`duplicate actionId ${action.actionId}`);
    seenActions.add(action.actionId);
    if (!knownCapabilities.has(action.capability)) errors.push(`unknown capability ${action.capability} on action ${action.actionId}`);
    if (action.featureFlag && !knownFeatureFlags.has(action.featureFlag)) errors.push(`unknown featureFlag ${action.featureFlag} on action ${action.actionId}`);
    for (const permission of [...(action.access.requiredAllPermissions ?? []), ...(action.access.requiredAnyPermissions ?? [])]) {
      if (!activePermissions.has(permission)) errors.push(`unknown or inactive permission ${permission} on action ${action.actionId}`);
      if (legacyPermission.test(permission) || roleOrTaxonomy.test(permission)) errors.push(`legacy/role/taxonomy permission ${permission} on action ${action.actionId}`);
    }
    for (const policy of action.access.policies ?? []) if (!knownPolicies.has(policy)) errors.push(`unknown policy ${policy} on action ${action.actionId}`);
  }

  for (const screen of registry.screens) {
    if (seenScreens.has(screen.screenId)) errors.push(`duplicate screenId ${screen.screenId}`);
    seenScreens.add(screen.screenId);
    if (!knownCapabilities.has(screen.capability)) errors.push(`unknown capability ${screen.capability} on screen ${screen.screenId}`);
    if (roleOrTaxonomy.test(`${screen.screenId} ${screen.capability}`)) errors.push(`role/taxonomy/provider identity on screen ${screen.screenId}`);
    const existingRoute = seenRoutes.get(screen.route.path);
    if (existingRoute) errors.push(`route path conflict ${screen.route.path} between ${existingRoute} and ${screen.screenId}`);
    seenRoutes.set(screen.route.path, screen.screenId);
    if (screen.route.scope !== "tenant" && screen.access.requiresOrganizationContext) errors.push(`organization context required on non-tenant route ${screen.screenId}`);
    if (screen.route.path.startsWith("/owner") && [...(screen.access.requiredAllPermissions ?? []), ...(screen.access.requiredAnyPermissions ?? [])].some((permission) => permission.startsWith("org."))) errors.push(`tenant permission on owner screen ${screen.screenId}`);
    if (screen.route.path.startsWith("/o/") && [...(screen.access.requiredAllPermissions ?? []), ...(screen.access.requiredAnyPermissions ?? [])].some((permission) => permission.startsWith("owner."))) errors.push(`owner permission on tenant screen ${screen.screenId}`);
    for (const actionId of screen.actions) if (!seenActions.has(actionId)) errors.push(`unknown action ${actionId} referenced by screen ${screen.screenId}`);
    for (const permission of [...(screen.access.requiredAllPermissions ?? []), ...(screen.access.requiredAnyPermissions ?? [])]) {
      if (!activePermissions.has(permission)) errors.push(`unknown or inactive permission ${permission} on screen ${screen.screenId}`);
      if (legacyPermission.test(permission) || roleOrTaxonomy.test(permission)) errors.push(`legacy/role/taxonomy permission ${permission} on screen ${screen.screenId}`);
    }
    for (const policy of screen.access.policies ?? []) if (!knownPolicies.has(policy)) errors.push(`unknown policy ${policy} on screen ${screen.screenId}`);
    if (screen.featureFlag && !knownFeatureFlags.has(screen.featureFlag)) errors.push(`unknown featureFlag ${screen.featureFlag} on screen ${screen.screenId}`);
    if (screen.navigation) {
      if (seenMenuKeys.has(screen.navigation.menuKey)) errors.push(`duplicate menuKey ${screen.navigation.menuKey}`);
      seenMenuKeys.add(screen.navigation.menuKey);
      if (!screen.navigation.breadcrumbKey) errors.push(`missing breadcrumb key on ${screen.screenId}`);
      if (screen.navigation.iconKey && !knownIcons.has(screen.navigation.iconKey)) errors.push(`unknown icon ${screen.navigation.iconKey} on ${screen.screenId}`);
      if (screen.navigation.parentMenuKey) parentLinks.set(screen.navigation.menuKey, screen.navigation.parentMenuKey);
    }
  }
  for (const [child, parent] of parentLinks) if (!seenMenuKeys.has(parent as MenuKey)) errors.push(`unknown parent ${parent} for ${child}`);
  for (const key of parentLinks.keys()) {
    const path = new Set<string>();
    let cursor: string | undefined = key;
    while (cursor) {
      if (path.has(cursor)) { errors.push(`navigation cycle at ${cursor}`); break; }
      path.add(cursor);
      cursor = parentLinks.get(cursor);
    }
  }
  return { valid: errors.length === 0, errors };
};
