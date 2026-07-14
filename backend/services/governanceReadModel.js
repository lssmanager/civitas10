"use strict";

const GOVERNANCE_READ_MODEL_CONTRACT_VERSION = "2026-07-civitas10-governance-read-model-v1";
const GOVERNANCE_OPERATION_REGISTRY_VERSION = "2026-07-civitas10-governance-operations-v1";

const MODULE_KEYS = Object.freeze(["overview", "permissions", "members", "taxonomy", "units", "data-scope", "aliases-navigation", "access-preview", "audit"]);
const ACTIVE_READ_MODULES = Object.freeze(new Set(["overview", "permissions", "taxonomy", "units", "data-scope", "aliases-navigation", "audit"]));
const TENANT_MODULES = Object.freeze(new Set(["permissions", "members", "data-scope", "taxonomy", "units", "aliases-navigation", "access-preview"]));
const OWNER_MODULES = Object.freeze(new Set(["overview", "permissions", "taxonomy", "units", "data-scope", "aliases-navigation", "access-preview", "audit"]));

function isoNow() { return new Date().toISOString(); }
function safeString(value, fallback = null) { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function organizationName(organization = {}) { return safeString(organization.name) || safeString(organization.nameCache) || safeString(organization.displayName); }

function buildVersions({ stale = false, drift = false } = {}) {
  const runtimeStatus = drift ? "drift" : stale ? "stale" : "current";
  return {
    catalogVersion: "2026-07-civitas10-active-permissions-v1",
    ceilingVersion: "not_mounted",
    activationVersion: "not_mounted",
    taxonomyVersion: "2026-07-civitas10-taxonomy-read-v1",
    unitsVersion: "2026-07-civitas10-units-read-v1",
    dataScopeVersion: "2026-07-civitas10-data-scope-read-v1",
    visualVersion: "2026-07-civitas10-visual-navigation-v1",
    policyVersion: "2026-07-civitas10-policy-runtime-v1",
    readModelVersion: GOVERNANCE_READ_MODEL_CONTRACT_VERSION,
    operationRegistryVersion: GOVERNANCE_OPERATION_REGISTRY_VERSION,
    runtimeStatus,
  };
}

function moduleStatus({ key, surface, versions }) {
  if (key === "members" && surface === "owner") return null;
  const supported = surface === "owner" ? OWNER_MODULES.has(key) : TENANT_MODULES.has(key);
  if (!supported) return null;
  if (versions.runtimeStatus === "stale") return { status: "stale", reason: "authorization_snapshot_stale", dependencyVersions: versions };
  if (versions.runtimeStatus === "drift") return { status: "stale", reason: "authorization_version_drift", dependencyVersions: versions };
  if (ACTIVE_READ_MODULES.has(key)) return { status: "active", reason: "read_model_projection_available", dependencyVersions: versions };
  return { status: "planned", reason: "owning_operation_not_mounted", dependencyVersions: versions };
}

function buildModules({ surface, versions }) {
  return Object.fromEntries(MODULE_KEYS.map((key) => [key, moduleStatus({ key, surface, versions })]).filter(([, value]) => value));
}

function buildPermissionMatrix(versions) {
  return [
    {
      permission: "governance.owner.read",
      canonical: true,
      rolePotential: true,
      ownerAllowed: true,
      tenantEnabled: null,
      effective: true,
      reason: { code: "allowed", sourceVersions: versions },
    },
    {
      permission: "governance.tenant.read",
      canonical: true,
      rolePotential: true,
      ownerAllowed: true,
      tenantEnabled: true,
      effective: true,
      reason: { code: "allowed", sourceVersions: versions },
    },
    {
      permission: "governance.preview.read",
      canonical: true,
      rolePotential: null,
      ownerAllowed: null,
      tenantEnabled: null,
      effective: false,
      reason: { code: "owning_operation_not_mounted", sourceVersions: versions },
    },
  ];
}

function buildAliasesNavigation() {
  return {
    aliasesTenantEditable: false,
    navigationTenantEditable: false,
    visualPreferences: [
      { screenId: "owner-governance", hidden: false, order: 20, locked: true },
      { screenId: "tenant-governance", hidden: false, order: 20, locked: true },
    ],
    summary: { reason: "navigation_preferences_read_only_projection", preferenceCount: 2 },
  };
}

function buildGovernanceReadModel({ organization, organizationId, surface, stale = false, drift = false } = {}) {
  const versions = buildVersions({ stale, drift });
  const modules = buildModules({ surface, versions });
  const logtoOrganizationId = organizationId || safeString(organization?.id) || safeString(organization?.logtoOrganizationId);
  return {
    contractVersion: GOVERNANCE_READ_MODEL_CONTRACT_VERSION,
    generatedAt: isoNow(),
    organization: { logtoOrganizationId, name: organizationName(organization), surface },
    organizationId: logtoOrganizationId,
    organizationName: organizationName(organization),
    surface,
    versions,
    runtimeStatus: versions.runtimeStatus,
    modules,
    summary: {
      status: versions.runtimeStatus === "current" ? "available" : versions.runtimeStatus,
      activeModules: Object.values(modules).filter((item) => item.status === "active").length,
      plannedModules: Object.values(modules).filter((item) => item.status === "planned").length,
      unavailableModules: Object.values(modules).filter((item) => item.status === "unavailable").length,
      reason: "aggregate_projection_only",
    },
    permissionMatrix: buildPermissionMatrix(versions),
    taxonomy: [],
    units: [],
    dataScopes: [],
    aliasesNavigation: buildAliasesNavigation(),
    accessPreviews: [],
    auditSummary: { totalEvents: 0, latestEventAt: null, redaction: "actor_subjects_and_before_after_payloads_redacted_in_aggregate" },
    auditEvents: [],
    diagnostics: [
      { code: "governance_read_model_projection", severity: "info", message: "Aggregate read model is mounted; feature writes remain in owning APIs." },
      ...(versions.runtimeStatus === "current" ? [] : [{ code: versions.runtimeStatus === "drift" ? "authorization_version_drift" : "authorization_snapshot_stale", severity: "warning", message: "Authorization runtime is not current." }]),
    ],
  };
}

function assertTenantRouteMatchesContext(req) {
  const routeOrganizationId = req.params.organizationId;
  const tokenOrganizationId = req.user?.organizationId || req.user?.claims?.organization_id || req.user?.claims?.organizationId || null;
  if (!tokenOrganizationId || tokenOrganizationId !== routeOrganizationId) {
    const error = new Error("Tenant governance route organization does not match the verified tenant context.");
    error.status = 403;
    error.code = "TENANT_ORGANIZATION_MISMATCH";
    throw error;
  }
}

module.exports = { GOVERNANCE_READ_MODEL_CONTRACT_VERSION, GOVERNANCE_OPERATION_REGISTRY_VERSION, buildGovernanceReadModel, assertTenantRouteMatchesContext };
