"use strict";

const ROLE_PERMISSIONS = Object.freeze({
  owner: Object.freeze([
    "owner:read",
    "owner:manage",
    "organization:create",
    "organization:read",
    "audit:read",
  ]),
  org_admin: Object.freeze([
    "organization:read",
    "organization:manage",
    "members:invite",
    "members:remove",
    "billing:manage",
  ]),
  member: Object.freeze([
    "organization:read",
    "profile:read",
  ]),
});

const JWT_ROLE_CLAIMS = Object.freeze([
  "roles",
  "role_names",
  "global_roles",
  "globalRoles",
  "organization_roles",
  "organizationRoles",
  "org_roles",
  "https://civitas.didaxus.com/claims/roles",
  "https://civitas.didaxus.com/roles",
  "https://civitas.didaxus.com/claims/role_names",
  "https://civitas.didaxus.com/role_names",
  "https://civitas.didaxus.com/claims/global_roles",
  "https://civitas.didaxus.com/global_roles",
]);

function createAuthorizationError(code, message, status = 403, details = {}) {
  const error = new Error(message);
  error.name = "AuthorizationError";
  error.code = code;
  error.status = status;
  error.statusCode = status;
  error.details = Object.freeze({ ...details });
  return error;
}

function decodeBase64UrlJson(value) {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch (cause) {
    throw createAuthorizationError("INVALID_JWT", "Invalid JWT payload", 401);
  }
}

function decodeJwtPayload(token) {
  if (typeof token !== "string" || token.trim() === "") {
    throw createAuthorizationError("MISSING_JWT", "JWT token is required", 401);
  }

  const parts = token.split(".");
  if (parts.length < 2 || !parts[1]) {
    throw createAuthorizationError("INVALID_JWT", "JWT must contain a payload", 401);
  }

  const payload = decodeBase64UrlJson(parts[1]);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createAuthorizationError("INVALID_JWT", "JWT payload must be an object", 401);
  }
  return payload;
}

function parseClaimList(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean);
  return [];
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function getRolesFromPayload(payload = {}) {
  const roles = JWT_ROLE_CLAIMS.flatMap((claimName) => parseClaimList(payload[claimName]));
  return unique(roles);
}

function getPermissionsForRoles(roles = []) {
  return unique(roles.flatMap((role) => ROLE_PERMISSIONS[role] || []));
}

function getPermissionsFromJWT(token) {
  return getPermissionsForRoles(getRolesFromPayload(decodeJwtPayload(token)));
}

function getBearerTokenFromRequest(req) {
  const authorization = req?.headers?.authorization || req?.headers?.Authorization;
  if (typeof authorization !== "string" || authorization.trim() === "") {
    throw createAuthorizationError("MISSING_AUTHORIZATION_HEADER", "Authorization header missing", 401);
  }

  const [scheme, token, extra] = authorization.trim().split(/\s+/);
  if (scheme !== "Bearer" || !token || extra) {
    throw createAuthorizationError("INVALID_AUTHORIZATION_HEADER", "Authorization header must use Bearer token", 401);
  }

  return token;
}

function requirePermission(permission) {
  if (typeof permission !== "string" || permission.trim() === "") {
    throw createAuthorizationError("INVALID_REQUIRED_PERMISSION", "Required permission must be a non-empty string", 500);
  }

  return (req, res, next) => {
    try {
      const permissions = getPermissionsFromJWT(getBearerTokenFromRequest(req));
      if (!permissions.includes(permission)) {
        throw createAuthorizationError("FORBIDDEN", "Forbidden", 403, { requiredPermission: permission });
      }
      req.permissions = Object.freeze([...permissions]);
      return next();
    } catch (error) {
      if (typeof next === "function") return next(error);
      throw error;
    }
  };
}

function readNumericTenantClaim(payload, claimName) {
  if (!Object.hasOwn(payload, claimName)) {
    throw createAuthorizationError("INVALID_TENANT_CONTEXT", "Invalid tenant context", 403, { missingClaim: claimName });
  }
  const value = Number(payload[claimName]);
  if (!Number.isFinite(value) || value < 0) {
    throw createAuthorizationError("INVALID_TENANT_CONTEXT", "Invalid tenant context", 403, { invalidClaim: claimName });
  }
  return value;
}

function requireSeats() {
  return (req, res, next) => {
    try {
      const payload = decodeJwtPayload(getBearerTokenFromRequest(req));
      const limit = readNumericTenantClaim(payload, "tenant_seats_limit");
      const used = readNumericTenantClaim(payload, "tenant_seats_used");

      if (used >= limit) {
        throw createAuthorizationError("SEATS_EXCEEDED", "Seats exceeded", 403, { tenantSeatsLimit: limit, tenantSeatsUsed: used });
      }

      req.tenantSeats = Object.freeze({ limit, used, available: limit - used });
      return next();
    } catch (error) {
      if (typeof next === "function") return next(error);
      throw error;
    }
  };
}

module.exports = {
  ROLE_PERMISSIONS,
  createAuthorizationError,
  decodeJwtPayload,
  getBearerTokenFromRequest,
  getPermissionsForRoles,
  getPermissionsFromJWT,
  getRolesFromPayload,
  requirePermission,
  requireSeats,
};
