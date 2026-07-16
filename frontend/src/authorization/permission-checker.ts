import type { AuthorizationContextResponse } from "./authorization-client";
import type { VisualAuthorizationContext } from "./contracts/authorization-context";
import type { ActionId, CapabilityKey, FeatureFlagKey, PermissionKey } from "./contracts/ids";

export const normalizeAuthorizationContext = (response: AuthorizationContextResponse): VisualAuthorizationContext => ({
  status: "ready",
  organizationId: response.organizationId,
  policyVersion: response.policyVersion,
  catalogVersion: response.catalogVersion,
  visualVersion: response.visualVersion,
  effectivePermissions: new Set(response.effectivePermissions.map((permission) => permission as PermissionKey)),
  effectiveActions: response.effectiveActions ? new Set(response.effectiveActions.map((action) => action as ActionId)) : undefined,
  availableDataScopeCapabilities: new Set((response.dataScopeSummary?.availableCapabilities ?? []).map((capability) => capability as CapabilityKey)),
  enabledFeatures: new Set((response.enabledFeatures ?? []).map((feature) => feature as FeatureFlagKey)),
  policyDecisions: new Map(),
});

export const hasEffectivePermission = (context: VisualAuthorizationContext, permission: PermissionKey | string) => context.status === "ready" && context.effectivePermissions.has(permission as PermissionKey);
