import type { ActionId, CapabilityKey, FeatureFlagKey, PermissionKey, PolicyKey } from "./ids";

export type PolicyDecision = { allowed: boolean; reason?: string; resourceBound?: boolean };
export type VisualAuthorizationContextStatus = "idle" | "loading" | "ready" | "stale" | "error" | "unauthenticated";

export type VisualAuthorizationContext = {
  status?: VisualAuthorizationContextStatus;
  organizationId?: string;
  policyVersion: string;
  catalogVersion: string;
  visualVersion?: string;
  effectivePermissions: ReadonlySet<PermissionKey>;
  effectiveActions?: ReadonlySet<ActionId>;
  availableDataScopeCapabilities: ReadonlySet<CapabilityKey>;
  enabledFeatures: ReadonlySet<FeatureFlagKey>;
  policyDecisions?: ReadonlyMap<PolicyKey, PolicyDecision>;
};
