"use strict";

const DELEGATION_REASON_CODES = Object.freeze({
  ALLOWED: "delegation_allowed",
  RULE_MISSING: "delegation_rule_missing",
  OPERATION_DENIED: "delegation_operation_denied",
  TENANT_RESTRICTED: "delegation_tenant_restricted",
  ACTOR_ROLE_UNKNOWN: "delegation_actor_role_unknown",
  TARGET_ROLE_UNKNOWN: "delegation_target_role_unknown",
  OWNER_GLOBAL_FORBIDDEN: "delegation_owner_global_forbidden",
  SELF_ASSIGNMENT_FORBIDDEN: "delegation_self_assignment_forbidden",
  CROSS_TENANT_FORBIDDEN: "delegation_cross_tenant_forbidden",
});

module.exports = { DELEGATION_REASON_CODES };
