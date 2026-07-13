import type { ActionId, CapabilityKey, FeatureFlagKey, PermissionKey, PolicyKey } from "./ids";

export type ActionDefinition = {
  actionId: ActionId;
  capability: CapabilityKey;
  access: {
    requiredAllPermissions?: readonly PermissionKey[];
    requiredAnyPermissions?: readonly PermissionKey[];
    policies?: readonly PolicyKey[];
    requiresDataScope?: boolean;
  };
  featureFlag?: FeatureFlagKey;
  presentation?: { labelKey?: string; confirmationKey?: string; danger?: boolean; responsivePlacement?: "primary" | "secondary" | "overflow" };
};
