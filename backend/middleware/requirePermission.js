"use strict";

const { hasPermission } = require("../authorization/roles");
function parseClaimList(value) { if (Array.isArray(value)) return value.map(String).filter(Boolean); if (typeof value === "string") return value.split(/[\s,]+/).filter(Boolean); return []; }
function getRequestRoles(req = {}) {
  const claims = req.user?.claims || {};
  return [...new Set([
    ...parseClaimList(req.user?.roles),
    ...parseClaimList(req.user?.globalRoles),
    ...parseClaimList(req.user?.organizationRoles),
    ...parseClaimList(claims.roles),
    ...parseClaimList(claims.global_roles),
    ...parseClaimList(claims.organization_roles),
  ])];
}
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized", message: "Authentication is required." });
    const roles = getRequestRoles(req);
    if (!hasPermission(roles, permission)) return res.status(403).json({ error: "Forbidden", message: "Missing required permission.", requiredPermission: permission, action: "ask_owner_to_assign_required_role" });
    return next();
  };
}
module.exports = { getRequestRoles, requirePermission };
