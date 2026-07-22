"use strict";

const crypto = require("node:crypto");

function createDecisionId() { return `authz_${crypto.randomUUID()}`; }
function asArray(value) { return Array.isArray(value) ? value.filter(Boolean).map(String) : []; }
function normalizeScopes(value) { return value instanceof Set ? value : new Set(asArray(value)); }
function buildRolePaths(principal, permission) {
  const source = principal.tokenType === "global" ? principal.globalRoleIds : principal.organizationRoleIds;
  return asArray(source).map((roleId, index) => ({ rolePathId: `role_path_${index}_${roleId}`, logtoRoleId: roleId, tokenScopePresent: principal.scopes.has(permission), policyResults: [] }));
}
function buildPolicyContext(input) {
  const principal = input.principal || {};
  const normalizedPrincipal = Object.freeze({
    subject: principal.subject || principal.sub || null,
    tokenType: principal.tokenType,
    audience: asArray(principal.audience),
    organizationId: principal.organizationId || null,
    scopes: normalizeScopes(principal.scopes),
    globalRoleIds: asArray(principal.globalRoleIds || principal.globalRoles),
    organizationRoleIds: asArray(principal.organizationRoleIds || principal.organizationRoles),
    actorSubject: principal.actorSubject,
    effectiveSubject: principal.effectiveSubject || principal.subject || principal.sub || null,
    tokenIssuedAt: principal.tokenIssuedAt || principal.issuedAt,
    tokenExpiresAt: principal.tokenExpiresAt || principal.expiresAt,
  });
  const decisionId = input.decisionId || createDecisionId();
  return {
    decisionId,
    principal: normalizedPrincipal,
    request: Object.freeze({ surface: input.surface, operation: input.operation, routeId: input.routeId || "unknown", routeOrganizationId: input.organizationId || input.routeOrganizationId, requestId: input.requestId, ipHash: input.ipHash }),
    authorization: Object.freeze({ permission: input.permission, actionId: input.actionId, requiredPolicies: Object.freeze([...(input.policies || [])]), policyVersion: input.policyVersion, snapshotVersion: input.snapshotVersion }),
    target: input.target ? Object.freeze({ ...input.target }) : undefined,
    resource: input.resource ? Object.freeze({ ...input.resource }) : undefined,
    rolePaths: buildRolePaths(normalizedPrincipal, input.permission),
    facts: { ...(input.facts || {}) },
  };
}
module.exports = { createDecisionId, buildPolicyContext, buildRolePaths };
