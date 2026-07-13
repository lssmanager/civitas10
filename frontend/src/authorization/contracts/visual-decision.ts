import type { ActionId, ScreenId } from "./ids";

export type VisualDecisionReason = "allowed" | "organization_context_missing" | "permission_missing" | "all_permissions_missing" | "policy_denied" | "data_scope_unavailable" | "feature_disabled" | "organization_preference_hidden" | "screen_unknown" | "action_unknown" | "authorization_context_stale" | "registry_invalid";
export type VisualDecision = { allowed: boolean; eligible: boolean; visible: boolean; reason: VisualDecisionReason; screenId?: ScreenId; actionId?: ActionId };
