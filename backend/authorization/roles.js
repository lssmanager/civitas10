"use strict";

const GLOBAL_ROLES = Object.freeze(["owner_global"]);
const ORGANIZATION_ROLES = Object.freeze({
  ADMIN: "organization_admin",
  MEMBER: "organization_member",
  TEACHER: "organization_teacher",
  STUDENT: "organization_student",
});
const CANONICAL_ROLES = Object.freeze({
  OWNER_GLOBAL: GLOBAL_ROLES[0],
  SUPPORT_AGENT: "support_agent",
  ORGANIZATION_ADMIN: ORGANIZATION_ROLES.ADMIN,
  ORGANIZATION_MEMBER: ORGANIZATION_ROLES.MEMBER,
  ORGANIZATION_TEACHER: ORGANIZATION_ROLES.TEACHER,
  ORGANIZATION_STUDENT: ORGANIZATION_ROLES.STUDENT,
});
const ROLE_PERMISSIONS = Object.freeze({
  [CANONICAL_ROLES.OWNER_GLOBAL]: Object.freeze(["*"]),
  [CANONICAL_ROLES.SUPPORT_AGENT]: Object.freeze(["organizations:read", "members:read", "support:read", "operations:read"]),
  [CANONICAL_ROLES.ORGANIZATION_ADMIN]: Object.freeze(["organizations:read", "members:read", "members:invite", "members:write", "members:remove"]),
  [CANONICAL_ROLES.ORGANIZATION_MEMBER]: Object.freeze(["organizations:read", "self:read"]),
  [CANONICAL_ROLES.ORGANIZATION_TEACHER]: Object.freeze(["organizations:read", "members:read", "lms:read"]),
  [CANONICAL_ROLES.ORGANIZATION_STUDENT]: Object.freeze(["self:read", "lms:self:read"]),
});
function unique(items) { return [...new Set(items.filter(Boolean))]; }
function getPermissionsForRoles(roles = []) { return unique(roles.flatMap((role) => ROLE_PERMISSIONS[role] || [])); }
function hasPermission(roles = [], permission) { const permissions = getPermissionsForRoles(roles); return permissions.includes("*") || permissions.includes(permission); }
module.exports = { GLOBAL_ROLES, ORGANIZATION_ROLES, CANONICAL_ROLES, ROLE_PERMISSIONS, getPermissionsForRoles, hasPermission };
