import type { ActionDefinition } from "../contracts/action-definition";
import type { VisualAuthorizationContext } from "../contracts/authorization-context";
import type { VisualDecision } from "../contracts/visual-decision";

const deny = (action: ActionDefinition, reason: VisualDecision["reason"]): VisualDecision => ({ allowed: false, eligible: false, visible: false, reason, actionId: action.actionId });

export const evaluateActionEligibility = (action: ActionDefinition, context: VisualAuthorizationContext): VisualDecision => {
  if (context.status && context.status !== "ready") return deny(action, "authorization_context_stale");
  if (action.access.requiredAllPermissions?.some((permission) => !context.effectivePermissions.has(permission))) return deny(action, "all_permissions_missing");
  if (action.access.requiredAnyPermissions?.length && !action.access.requiredAnyPermissions.some((permission) => context.effectivePermissions.has(permission))) return deny(action, "permission_missing");
  if (action.access.policies?.some((policy) => context.policyDecisions?.get(policy)?.allowed === false)) return deny(action, "policy_denied");
  if (action.access.requiresDataScope && !context.availableDataScopeCapabilities.has(action.capability)) return deny(action, "data_scope_unavailable");
  if (action.featureFlag && !context.enabledFeatures.has(action.featureFlag)) return deny(action, "feature_disabled");
  if (context.effectiveActions && !context.effectiveActions.has(action.actionId)) return deny(action, "permission_missing");
  return { allowed: true, eligible: true, visible: true, reason: "allowed", actionId: action.actionId };
};
