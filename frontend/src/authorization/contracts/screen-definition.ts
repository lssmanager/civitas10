import type { ActionId, CapabilityKey, FeatureFlagKey, IconKey, MenuKey, PermissionKey, PolicyKey, ResponsiveGroupKey, RouteId, ScreenId } from "./ids";

export type RouteReference = { routeId: RouteId; path: string; scope: "owner" | "tenant" | "account" | "public" };

export type ScreenDefinition = {
  screenId: ScreenId;
  capability: CapabilityKey;
  route: RouteReference;
  navigation?: {
    menuKey: MenuKey;
    parentMenuKey?: MenuKey;
    labelKey: string;
    breadcrumbKey: string;
    iconKey?: IconKey;
    responsiveGroup?: ResponsiveGroupKey;
    order?: number;
  };
  access: {
    requiredAllPermissions?: readonly PermissionKey[];
    requiredAnyPermissions?: readonly PermissionKey[];
    policies?: readonly PolicyKey[];
    requiresOrganizationContext: boolean;
    requiresDataScope?: boolean;
  };
  featureFlag?: FeatureFlagKey;
  organizationCustomization: { visibility: "locked" | "hideable"; order: "locked" | "customizable" };
  actions: readonly ActionId[];
};

export type OrganizationVisualPreference = { organizationId: string; screenId: ScreenId; hidden?: boolean; order?: number; version: string };
