"use strict";

const { authorize } = require("../authorize");
const { createTokenMembershipProvider, createStaticResourceOwnershipProvider, createAuditReadinessProvider } = require("../providers");

function principalFromRequest(req) {
  const auth = req.auth || {};
  const user = req.user || {};
  return {
    subject: auth.subject || user.sub || user.id,
    tokenType: auth.tokenType || (auth.organizationId || user.organizationId ? "organization" : "global"),
    audience: auth.audience || [],
    organizationId: auth.organizationId || user.organizationId || null,
    scopes: auth.scopes instanceof Set ? auth.scopes : new Set(Array.isArray(user.scopes) ? user.scopes : []),
    globalRoleIds: auth.globalRoleIds || auth.globalRoles || user.globalRoleIds || user.globalRoles || [],
    organizationRoleIds: auth.organizationRoleIds || auth.organizationRoles || user.organizationRoleIds || user.organizationRoles || [],
    tokenIssuedAt: auth.issuedAt || user.issuedAt,
    tokenExpiresAt: auth.expiresAt || user.expiresAt,
  };
}

function defaultProviders(overrides = {}) {
  return {
    membershipProvider: overrides.membershipProvider || createTokenMembershipProvider(),
    resourceOwnershipProvider: overrides.resourceOwnershipProvider || createStaticResourceOwnershipProvider(),
    auditReadinessProvider: overrides.auditReadinessProvider || createAuditReadinessProvider(),
    ...overrides,
  };
}

function requireAuthorization({ permission, actionId, surface, operation, policies = [], providers, targetResolver, resourceResolver, auditIntentResolver, registry } = {}) {
  if (!permission || !surface || !operation) throw new Error("requireAuthorization requires permission, surface and operation");
  if (!Array.isArray(policies)) throw new Error("requireAuthorization policies must be declared server-side as an array");
  return async (req, res, next) => {
    if (!req.auth && !req.user) return res.status(401).json({ error: "Unauthorized", code: "authentication_required" });
    try {
      const target = targetResolver ? await targetResolver(req) : undefined;
      const resource = resourceResolver ? await resourceResolver(req) : undefined;
      const facts = {};
      if (auditIntentResolver) facts.auditIntent = await auditIntentResolver(req);
      const decision = await authorize({ principal: principalFromRequest(req), permission, actionId, surface, operation, organizationId: req.params?.organizationId || req.user?.organizationId || req.auth?.organizationId, routeId: req.routeId || actionId || permission, target, resource, policies, providers: defaultProviders(providers), registry, facts });
      req.authorizationDecision = decision;
      if (decision.allowed) return next();
      return res.status(403).json({ error: "Forbidden", code: decision.reasonCode, decisionId: decision.decisionId });
    } catch (error) {
      return res.status(500).json({ error: "AuthorizationPolicyError", code: "policy_evaluation_failed" });
    }
  };
}

module.exports = { requireAuthorization, principalFromRequest, defaultProviders };
