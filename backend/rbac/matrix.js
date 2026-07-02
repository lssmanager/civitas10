"use strict";

const jwtPermissions = require("../../auth/permissions");

const GLOBAL_ROLES = Object.freeze({
  OWNER: "owner",
});

const ORGANIZATION_ROLES = Object.freeze({
  ADMIN: "org_admin",
  MEMBER: "member",
});

const RBAC_MATRIX = jwtPermissions.ROLE_PERMISSIONS;

const requireOrg = (req, res, next) => {
  const organizationId = req.params?.organizationId || req.params?.id || req.user?.organizationId || req.body?.organizationId;
  if (!organizationId) {
    return res.status(403).json({
      error: "Forbidden",
      message: "organization_id is required for B2B operations.",
    });
  }
  req.organizationId = organizationId;
  return next();
};

const hasPermission = (roles = [], permission) => jwtPermissions.getPermissionsForRoles(roles).includes(permission);

module.exports = {
  GLOBAL_ROLES,
  ORGANIZATION_ROLES,
  RBAC_MATRIX,
  getPermissionsForRoles: jwtPermissions.getPermissionsForRoles,
  hasPermission,
  requireOrg,
  requirePermission: jwtPermissions.requirePermission,
  requireSeats: jwtPermissions.requireSeats,
};
