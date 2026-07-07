"use strict";

const { GLOBAL_ROLES } = require("./roles");

const requireGlobalOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized", message: "Authentication is required." });
  }
  const globalRoles = Array.isArray(req.user.globalRoles) ? req.user.globalRoles : [];
  if (!globalRoles.includes(GLOBAL_ROLES.OWNER)) {
    return res.status(403).json({ error: "Forbidden", message: `Missing required global role: ${GLOBAL_ROLES.OWNER}`, requiredGlobalRole: GLOBAL_ROLES.OWNER });
  }
  return next();
};

const requireOrganizationRole = (requiredRoleName) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized", message: "Authentication is required." });
  const organizationId = req.user.organizationId || req.user.claims?.organization_id || req.user.claims?.organizationId || null;
  if (!organizationId) {
    return res.status(403).json({ error: "OrganizationContextRequired", message: "Organization authorization requires an organization-scoped token and membership context." });
  }
  const roles = Array.isArray(req.user.organizationRoles) ? req.user.organizationRoles : [];
  if (!roles.includes(requiredRoleName)) {
    return res.status(403).json({ error: "Forbidden", message: `Missing required Logto organization role: ${requiredRoleName}`, requiredRole: requiredRoleName, organizationId });
  }
  return next();
};

module.exports = { requireGlobalOwner, requireOrganizationRole };
