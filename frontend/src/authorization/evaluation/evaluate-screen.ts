import type { VisualAuthorizationContext } from "../contracts/authorization-context";
import type { OrganizationVisualPreference, ScreenDefinition } from "../contracts/screen-definition";
import type { VisualDecision } from "../contracts/visual-decision";

const deny = (screen: ScreenDefinition, reason: VisualDecision["reason"]): VisualDecision => ({ allowed: false, eligible: false, visible: false, reason, screenId: screen.screenId });

export const evaluateScreenEligibility = (screen: ScreenDefinition, context: VisualAuthorizationContext): VisualDecision => {
  if (context.status && context.status !== "ready") return deny(screen, "authorization_context_stale");
  if (screen.access.requiresOrganizationContext && !context.organizationId) return deny(screen, "organization_context_missing");
  if (screen.access.requiredAllPermissions?.some((permission) => !context.effectivePermissions.has(permission))) return deny(screen, "all_permissions_missing");
  if (screen.access.requiredAnyPermissions?.length && !screen.access.requiredAnyPermissions.some((permission) => context.effectivePermissions.has(permission))) return deny(screen, "permission_missing");
  if (screen.access.policies?.some((policy) => context.policyDecisions?.get(policy)?.allowed === false)) return deny(screen, "policy_denied");
  if (screen.access.requiresDataScope && !context.availableDataScopeCapabilities.has(screen.capability)) return deny(screen, "data_scope_unavailable");
  if (screen.featureFlag && !context.enabledFeatures.has(screen.featureFlag)) return deny(screen, "feature_disabled");
  return { allowed: true, eligible: true, visible: true, reason: "allowed", screenId: screen.screenId };
};

export const resolveScreenVisibility = (eligibility: VisualDecision, screen: ScreenDefinition, preference?: OrganizationVisualPreference): VisualDecision => {
  if (!eligibility.eligible) return { ...eligibility, allowed: false, visible: false };
  const hidden = screen.organizationCustomization.visibility === "hideable" && preference?.hidden === true;
  return hidden ? { ...eligibility, allowed: true, eligible: true, visible: false, reason: "organization_preference_hidden" } : { ...eligibility, allowed: true, eligible: true, visible: true, reason: "allowed" };
};
