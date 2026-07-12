"use strict";

const TENANT_ROUTE_PREFIX = "/o/:organizationId";
const ORGANIZATION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

function assertSafeOrganizationId(organizationId) {
  const value = String(organizationId || "").trim();
  if (!ORGANIZATION_ID_PATTERN.test(value)) throw new Error("organization_id_invalid");
  if (value.includes("/") || value.includes("\\")) throw new Error("organization_id_slash_injection");
  return value;
}

function normalizeRelativePath(relativePath = "") {
  const value = String(relativePath || "").trim();
  if (value.includes("..") || value.includes("\\")) throw new Error("tenant_relative_path_invalid");
  return value.replace(/^\/+/, "").replace(/\/+/g, "/");
}

function organizationPath(organizationId, relativePath = "") {
  const safeOrganizationId = assertSafeOrganizationId(organizationId);
  const normalized = normalizeRelativePath(relativePath);
  return `/o/${encodeURIComponent(safeOrganizationId)}${normalized ? `/${normalized}` : ""}`;
}

const TENANT_ROUTE_INVENTORY = Object.freeze([
  Object.freeze({ routeId: "documents.read", method: "GET", currentPath: "/documents", canonicalPath: "/o/:organizationId/documents", surface: "organization", currentMiddleware: "requireOrganizationAccess + requireOrg + requirePermission + requireAuthorization", requiredPermission: "org.documents.read", requiredPolicies: Object.freeze(["same-organization", "membership-required"]), legacyBehavior: "redirect", status: "canonical-mounted" }),
  Object.freeze({ routeId: "documents.create", method: "POST", currentPath: "/documents", canonicalPath: "/o/:organizationId/documents", surface: "organization", currentMiddleware: "requireOrganizationAccess + requireOrg + requirePermission + requireAuthorization", requiredPermission: "org.documents.create", requiredPolicies: Object.freeze(["same-organization", "membership-required", "critical-operation-audited"]), legacyBehavior: "reject", status: "canonical-mounted" }),
  Object.freeze({ routeId: "owner.organizations.operational-state", method: "GET", currentPath: "/owner/organizations/:organizationId/operational-state", canonicalPath: "/owner/organizations/:organizationId/operational-state", surface: "owner", currentMiddleware: "requireGlobalAccess + requireGlobalOwner", requiredPermission: "owner.runtime.read", requiredPolicies: Object.freeze([]), legacyBehavior: "none", status: "owner-surface" }),
]);

module.exports = { TENANT_ROUTE_PREFIX, ORGANIZATION_ID_PATTERN, TENANT_ROUTE_INVENTORY, assertSafeOrganizationId, normalizeRelativePath, organizationPath };
