"use strict";
const { createPolicyRegistry } = require("./registry");
const corePolicies = [
  require("./core/sameOrganization"),
  require("./core/resourceBelongsToOrganization"),
  require("./core/membershipRequired"),
  require("./core/targetRoleDelegable"),
  require("./core/cannotEscalatePrivileges"),
  require("./core/cannotModifyOwnerGlobal"),
  require("./core/criticalOperationAudited"),
  require("./core/connectorEnabled"),
  require("./core/seatAvailability"),
  require("./core/featureEnabled"),
  require("./owner/impersonationAllowed"),
  require("./owner/targetUserEligible"),
  require("./owner/targetOrganizationValid"),
  require("./owner/noImpersonationChaining"),
  require("./owner/criticalActionRestricted"),
  require("./extensions/entitlement/orgRoleEntitlementEnabled"),
  require("./extensions/entitlement/authorizationSnapshotCurrent"),
  require("./extensions/data-scope/authorizationDataScopeValid"),
  require("./extensions/data-scope/authorizationResourceInScope"),
  require("./extensions/billing/seatRequestStateTransition"),
  require("./extensions/billing/seatRequestApprovalEligibility"),
];
function createDefaultPolicyRegistry() {
  const registry = createPolicyRegistry();
  corePolicies.forEach((policy) => registry.registerPolicy(policy));
  return registry.freezeRegistry();
}
module.exports = { createDefaultPolicyRegistry, corePolicies: Object.freeze(corePolicies) };
