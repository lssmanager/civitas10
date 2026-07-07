const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { validateDeploymentConfig } = require("../core/deployment/deployment-kernel.cjs");
const { requireAuth, requireGlobalAccess, requireOrganizationAccess, requireOrganizationRole } = require("./middleware/auth");
const { requireOrg } = require("./middleware/requireOrg");
const { requirePermission } = require("./middleware/requirePermission");
const { createSecurityPolicyRegistry } = require("./middleware/securityPolicies");
const {
  listLogtoOrganizations,
  listLogtoOrganizationRoles,
  getLogtoOrganizationById,
} = require("./services/logtoManagement");
const {
  normalizeProvisioningInput,
  runCanonicalOrganizationProvisioning,
} = require("./services/organizationProvisioningCore");
const { buildConsolidatedOperationalResponse } = require("./services/operationalStateAssembler");
const { buildOperationalOrganization, deriveOperationalProfile, getLogtoOrganizationId, getLogtoOrganizationName } = require("./services/ownerOperationalProfile");
const { listRuntimeState } = require("./services/organizationRuntimeState");
const { getWorkerHealthSnapshot, loadWorkerHealthSnapshot, loadWorkerQueuesObservability } = require("./services/operationalObservability");
const { getDatabaseHealth } = require("./lib/databaseHealth");
const { getRedisHealth } = require("./lib/redisHealth");
const { validateRuntimeEnv, waitForDatabase } = require("./runtime/env");
const { prepareOperationalDatabase } = require("./runtime/migrations");
const { pingDatabase } = require("./lib/db");
const { createOperation, listOperationalState } = require("./services/operationalOperations");
const { listRegistry, loadConnectorRows } = require("./services/registryStore");
const { createOrganizationProvisioningRecorder } = require("./services/organizationProvisioningRecorder");
const { OWNER_CAPABILITIES, buildOwnerOperationalStateResponse } = require("./services/ownerCapabilitySurfaces");
const { requireGlobalOwner } = require("./authorization/guards");

const app = express();
const port = 3000;
const deploymentConfig = validateDeploymentConfig({ service: "backend" });
const SHARED_AUTH = deploymentConfig.contract.auth;
const API_RESOURCE = deploymentConfig.logtoResource;
const OWNER_GLOBAL_ROLE = SHARED_AUTH.global.ownerRole;
const OWNER_SCOPES = SHARED_AUTH.global.scopes;

app.use(cors());
// Orden canónico de middlewares tenant: requireOrganizationAccess → requireOrg → requirePermission → requireSeats (solo si aplica) → handler.
const secureRoute = createSecurityPolicyRegistry({ app });

const summarizeStatus = (statuses) => {
  if (statuses.includes("unhealthy")) return "unhealthy";
  if (statuses.includes("degraded")) return "degraded";
  return "healthy";
};

const getLogtoConfigHealth = () => {
  const required = ["LOGTO_M2M_CLIENT_ID", "LOGTO_M2M_CLIENT_SECRET"];
  const missing = required.filter((name) => !process.env[name]);
  return { status: missing.length ? "unhealthy" : "healthy", configured: missing.length === 0, missing };
};

const getWorkerReadiness = () => ({
  status: process.env.REDIS_URL ? "healthy" : "degraded",
  queueConfigured: Boolean(process.env.REDIS_URL),
  message: process.env.REDIS_URL
    ? "Worker runtime can publish heartbeat and queue state to the owner backbone."
    : "Configure REDIS_URL to enable worker queue execution and heartbeat publishing.",
});


const SAFE_PUBLIC_ERROR_NAMES = new Set(["LogtoManagementApiError"]);
const sanitizePublicErrorResponse = (error, fallbackName, fallbackMessage) => {
  const rawStatus = error && Number.isInteger(error.status) ? error.status : 500;
  const status = rawStatus >= 400 && rawStatus < 600 ? rawStatus : 500;
  const safeError = error && (status < 500 || SAFE_PUBLIC_ERROR_NAMES.has(error.name)) ? error : null;
  if (safeError?.error === "invalid_initial_organization_role") {
    return {
      status,
      body: {
        error: safeError.error,
        message: safeError.message,
        requestedRole: safeError.requestedRole,
        availableRoles: safeError.availableRoles || [],
      },
    };
  }
  return {
    status,
    body: {
      error: safeError && safeError.name ? safeError.name : fallbackName,
      message: safeError && typeof safeError.message === "string" ? safeError.message : fallbackMessage,
      ...(safeError && typeof safeError.code === "string" ? { code: safeError.code } : {}),
      ...(safeError && safeError.body && typeof safeError.body === "object" ? { details: safeError.body } : {}),
    },
  };
};
const sendPublicError = (res, error, fallbackName, fallbackMessage) => {
  const response = sanitizePublicErrorResponse(error, fallbackName, fallbackMessage);
  return res.status(response.status).json(response.body);
};
const ORGANIZATION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const requireSafeOrganizationIdParam = (req, res, next) => {
  if (!ORGANIZATION_ID_PATTERN.test(req.params.organizationId || "")) {
    return res.status(400).json({ error: "ValidationError", message: "Invalid organization identifier." });
  }
  return next();
};

const buildMeResponse = (user) => {
  const globalRoles = Array.isArray(user?.globalRoles) ? user.globalRoles : [];
  const organizationRoles = Array.isArray(user?.organizationRoles) ? user.organizationRoles : [];
  return {
    auth: {
      sub: user?.sub || user?.id || null,
      organizationId: user?.organizationId || null,
      scopes: user?.scopes || [],
      roles: user?.roles || [],
      globalRoles,
      organizationRoles,
      owner: {
        canReadOwner: globalRoles.includes(OWNER_GLOBAL_ROLE),
        canWriteOwner: globalRoles.includes(OWNER_GLOBAL_ROLE),
      },
    },
  };
};

async function loadOrganizationRuntimeStateSafe(logtoOrganizationId) {
  if (!logtoOrganizationId) return [];
  try { return await listRuntimeState({ logtoOrganizationId }); }
  catch (_error) { return []; }
}

async function loadOwnerConnectorRowsSafe(logtoOrganizationId) {
  if (!logtoOrganizationId) return [];
  const rows = [];
  for (const capability of OWNER_CAPABILITIES) {
    try { rows.push(...await loadConnectorRows({ logtoOrganizationId, capability })); }
    catch (_error) { /* Registry DB may be unavailable during bootstrap; unconfigured capabilities remain explicit. */ }
  }
  return rows;
}

async function buildOwnerProfile(organization) {
  const logtoOrganizationId = getLogtoOrganizationId(organization);
  const runtimeStateRows = await loadOrganizationRuntimeStateSafe(logtoOrganizationId);
  return deriveOperationalProfile(organization, { runtimeStateRows });
}

const serializeOwnerOrganization = async (organization) => {
  const profile = await buildOwnerProfile(organization);
  return {
    logtoOrganizationId: getLogtoOrganizationId(organization),
    name: getLogtoOrganizationName(organization),
    logtoOrganization: organization,
    profile,
    runtimeState: profile.runtimeState,
    legacy: profile.legacy,
  };
};

secureRoute.get("/health", "health", async (_req, res) => {
  const [database, redis] = await Promise.all([getDatabaseHealth(), getRedisHealth()]);
  const logto = getLogtoConfigHealth();
  const worker = getWorkerReadiness();
  const statuses = [database.status, redis.status, logto.status, worker.status];
  const status = summarizeStatus(statuses);
  res.status(status === "unhealthy" ? 503 : 200).json({
    status: status === "healthy" ? "ok" : status,
    service: "civitas10-backend",
    services: {
      api: "ok",
      database: database.status === "healthy" ? "ok" : "unhealthy",
      redis: redis.status === "healthy" ? "ok" : "unhealthy",
      logto: logto.status === "healthy" ? "ok" : logto.status,
      worker: worker.status === "healthy" ? "ok" : worker.status,
    },
    details: { database, redis, logto, worker },
    db: database.status === "healthy" ? "connected" : "disconnected",
    redis: redis.status === "healthy" ? "connected" : "disconnected",
  });
});

secureRoute.get("/me", "authenticatedRead", requireAuth(API_RESOURCE), (req, res) => {
  res.json(buildMeResponse(req.user));
});

secureRoute.get("/owner/me", "ownerRead", requireGlobalAccess({ resource: API_RESOURCE, requiredScopes: [OWNER_SCOPES.ownerRead] }), requireGlobalOwner, (req, res) => {
  const me = buildMeResponse(req.user);
  res.json({
    owner: {
      logtoUserId: me.auth.sub,
      internalUserId: me.auth.sub,
      authorizedBy: "shared_contract_logto_global_role_and_scope",
      requiredScope: OWNER_SCOPES.ownerRead,
      requiredWriteScope: OWNER_SCOPES.ownerWrite,
      canReadOwner: me.auth.owner.canReadOwner,
      canWriteOwner: me.auth.owner.canWriteOwner,
      globalRoles: me.auth.globalRoles,
      scopes: me.auth.scopes,
    },
  });
});

secureRoute.get("/owner/organization-template", "ownerRead", requireGlobalAccess({ resource: API_RESOURCE, requiredScopes: [OWNER_SCOPES.organizationRead] }), requireGlobalOwner, async (_req, res) => {
  try {
    const roles = await listLogtoOrganizationRoles();
    return res.json({
      roles: roles.map((role) => ({ id: role.id || role.organizationRoleId || role.roleId, name: role.name || role.nameCache || role.key })).filter((role) => role.id && role.name),
      roleSource: "logto_management_api",
      ready: true,
    });
  } catch (error) {
    return sendPublicError(res, error, "OwnerOrganizationTemplateError", "Failed to load Logto organization template");
  }
});

secureRoute.get("/owner/organizations", "ownerRead", requireGlobalAccess({ resource: API_RESOURCE, requiredScopes: [OWNER_SCOPES.organizationRead] }), requireGlobalOwner, async (_req, res) => {
  try {
    const organizations = await listLogtoOrganizations();
    return res.json({ organizations: await Promise.all(organizations.map(serializeOwnerOrganization)) });
  } catch (error) {
    return sendPublicError(res, error, "OwnerOrganizationsListError", "Failed to list organizations from Logto");
  }
});

secureRoute.get("/owner/organizations/:organizationId/operational-state", "ownerRead", requireGlobalAccess({ resource: API_RESOURCE, requiredScopes: [OWNER_SCOPES.ownerRead, OWNER_SCOPES.runtimeRead] }), requireGlobalOwner, requireSafeOrganizationIdParam, async (req, res) => {
  try {
    const logtoOrganization = await getLogtoOrganizationById(req.params.organizationId);
    const profile = await buildOwnerProfile(logtoOrganization);
    const workerHealth = await loadWorkerHealthSnapshot();
    const operationalState = await listOperationalState({ limit: 100 });
    const baseResponse = buildConsolidatedOperationalResponse({
      organization: buildOperationalOrganization(logtoOrganization, profile),
      logtoOrganization,
      profile,
      pending: operationalState.operations.filter((operation) => operation.logtoOrganizationId === req.params.organizationId),
      events: operationalState.auditLogRows.filter((row) => row.logtoOrganizationId === req.params.organizationId),
      workerHealth,
      generatedAt: new Date(),
      compatibility: { repository: "civitas10", mode: "clean_foundation_no_legacy_sync_tables" },
    });
    const runtimeStateRows = await loadOrganizationRuntimeStateSafe(req.params.organizationId);
    const connectorRows = await loadOwnerConnectorRowsSafe(req.params.organizationId);
    return res.json(buildOwnerOperationalStateResponse({ baseResponse, organization: buildOperationalOrganization(logtoOrganization, profile), connectorRows, runtimeStateRows, profile }));
  } catch (error) {
    return sendPublicError(res, error, "OwnerOperationalStateError", "Failed to build operational state");
  }
});

secureRoute.get("/owner/system/worker-queues", "ownerRead", requireGlobalAccess({ resource: API_RESOURCE, requiredScopes: [OWNER_SCOPES.workerQueuesRead] }), requireGlobalOwner, async (_req, res) => {
  try {
    const organizations = await listLogtoOrganizations().catch(() => []);
    const profiles = await Promise.all(organizations.map(buildOwnerProfile));
    const operationalState = await listOperationalState({ limit: 200 });
    const aggregate = await loadWorkerQueuesObservability({ profiles, operations: operationalState.operations, steps: operationalState.steps, auditLogRows: operationalState.auditLogRows });
    return res.json(aggregate);
  } catch (error) {
    return sendPublicError(res, error, "OwnerWorkerQueuesError", "Failed to load worker and queues observability");
  }
});

secureRoute.get("/owner/system/registry", "ownerRead", requireGlobalAccess({ resource: API_RESOURCE, requiredScopes: [OWNER_SCOPES.runtimeRead] }), requireGlobalOwner, async (_req, res) => {
  try {
    return res.json(await listRegistry());
  } catch (error) {
    return sendPublicError(res, error, "OwnerRegistryError", "Failed to load operational registry");
  }
});

secureRoute.post("/owner/system/operations", "operationalTrigger", requireGlobalAccess({ resource: API_RESOURCE, requiredScopes: [OWNER_SCOPES.runtimeWrite] }), requireGlobalOwner, async (req, res) => {
  try {
    const operation = await createOperation(req.body || {});
    return res.status(202).json({ operation });
  } catch (error) {
    return sendPublicError(res, error, "OperationalOperationCreateError", "Failed to enqueue operational operation");
  }
});

secureRoute.post(["/owner/organizations", "/organizations"], "ownerSensitiveWrite", requireGlobalAccess({ resource: API_RESOURCE, requiredScopes: [OWNER_SCOPES.organizationCreate] }), requireGlobalOwner, async (req, res) => {
  try {
    const normalized = normalizeProvisioningInput(req.body || {});
    if (normalized.errors.length > 0) {
      return res.status(400).json({ error: "ValidationError", message: "Organization provisioning input is invalid", details: normalized.errors });
    }
    const actor = { type: "owner_global", logtoUserId: req.user?.sub || req.user?.id || null };
    const recorder = createOrganizationProvisioningRecorder({ actor, idempotencyKey: req.get?.("idempotency-key") || req.body?.idempotencyKey || null });
    const result = await runCanonicalOrganizationProvisioning({ input: normalized.value, actor, recorder });
    return res.status(201).json({
      status: result.status,
      data: result.organization,
      bootstrap: {
        firstAdminUserId: result.administrativeContactAssignments[0]?.logtoUserId || null,
        assignedOrganizationRole: result.administrativeContactAssignments[0]?.roleName || null,
        administrativeContactAssignments: result.administrativeContactAssignments,
        jitProvisioning: result.jitProvisioning,
      },
    });
  } catch (error) {
    return sendPublicError(res, error, "OrganizationProvisioningError", "Failed to create organization in Logto");
  }
});

secureRoute.get("/documents", "organizationMemberRead", requireOrganizationAccess({ requiredScopes: ["read:documents"] }), requireOrg, requireOrganizationRole(SHARED_AUTH.organization.roles.member), requirePermission("lms:read"), async (_req, res) => {
  res.json([
    { id: "1", title: "Getting Started Guide", updatedAt: "2024-03-15", updatedBy: "John Doe", preview: "Welcome to Civitas clean foundation..." },
    { id: "2", title: "Operational Contract Notes", updatedAt: "2024-03-14", updatedBy: "Alice Smith", preview: "The owner backbone now prefers operational-state over legacy logs..." },
  ]);
});

secureRoute.post("/documents", "organizationAdminWrite", requireOrganizationAccess({ requiredScopes: ["create:documents"] }), requireOrg, requireOrganizationRole(SHARED_AUTH.organization.roles.admin), requirePermission("members:write"), async (_req, res) => {
  res.json({ data: "Document created" });
});

secureRoute.get("/", "public", (_req, res) => {
  res.json({ message: "Welcome to the Civitas 10 API" });
});

secureRoute.assertAllRegisteredRoutesHavePolicies();

if (require.main === module) {
  Promise.resolve()
    .then(() => validateRuntimeEnv({ requireRedis: true }))
    .then(() => waitForDatabase({ ping: pingDatabase }))
    .then(() => prepareOperationalDatabase())
    .then(() => app.listen(port, () => { console.log(`Server is running on port ${port}`); }))
    .catch((error) => { console.error(`Backend startup failed: ${error.message}`); process.exit(1); });
}

module.exports = { app, secureRoute, getWorkerHealthSnapshot, deriveOperationalProfile, requireGlobalOwner };
