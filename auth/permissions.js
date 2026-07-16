"use strict";

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const [, payload] = token.split(".");
  if (!payload) return null;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); }
  catch (_error) { return null; }
}

function normalizeScopes(value) {
  if (Array.isArray(value)) return unique(value.map(String));
  if (typeof value === "string") return unique(value.split(/\s+/));
  return [];
}

function getPermissionsFromJWT(token) {
  const payload = decodeJwtPayload(token);
  if (!payload) return [];
  return normalizeScopes(payload.scope);
}

function requirePermission(permission) {
  if (!permission || typeof permission !== "string" || permission.includes("*") || permission.includes(":")) {
    throw new Error("Canonical scope-only permission required");
  }
  return (req, res, next) => {
    const scopes = req.auth?.scopes instanceof Set ? [...req.auth.scopes] : (Array.isArray(req.user?.scopes) ? req.user.scopes : []);
    if (scopes.includes(permission)) return next();
    return res.status(403).json({ error: "Forbidden", code: "permission_missing", requiredPermission: permission });
  };
}

module.exports = { decodeJwtPayload, getPermissionsFromJWT, normalizeScopes, requirePermission };
