"use strict";

const CANONICAL_ROLES = Object.freeze({
  OWNER: "owner",
  SUPPORT_AGENT: "support_agent",
  ORGANIZATION_ADMIN: "organization:admin",
  ORGANIZATION_TEACHER: "organization:teacher",
  ORGANIZATION_STUDENT: "organization:student",
});
const ROLE_PERMISSIONS = Object.freeze({
  [CANONICAL_ROLES.OWNER]: Object.freeze(["*"]),
  [CANONICAL_ROLES.SUPPORT_AGENT]: Object.freeze(["organizations:read", "members:read", "support:read", "operations:read"]),
  [CANONICAL_ROLES.ORGANIZATION_ADMIN]: Object.freeze(["organizations:read", "members:read", "members:invite", "members:write", "members:remove"]),
  [CANONICAL_ROLES.ORGANIZATION_TEACHER]: Object.freeze(["organizations:read", "members:read", "lms:read"]),
  [CANONICAL_ROLES.ORGANIZATION_STUDENT]: Object.freeze(["self:read", "lms:self:read"]),
});
function unique(items) { return [...new Set(items.filter(Boolean))]; }
function getPermissionsForRoles(roles = []) { return unique(roles.flatMap((role) => ROLE_PERMISSIONS[role] || [])); }
function hasPermission(roles = [], permission) { const permissions = getPermissionsForRoles(roles); return permissions.includes("*") || permissions.includes(permission); }
module.exports = { CANONICAL_ROLES, ROLE_PERMISSIONS, getPermissionsForRoles, hasPermission };
