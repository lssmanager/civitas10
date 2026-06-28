const express = require("express");
const cors = require("cors");
require("dotenv").config();

const {
  requireAuth,
  requireOrganizationAccess,
} = require("./middleware/auth");
const {
  addUserToLogtoOrganization,
  assignOrganizationRoleToUser,
  createLogtoOrganization,
  ensureOrganizationTemplate,
  findOrganizationRoleByName,
  ORGANIZATION_ADMIN_ROLE_NAME,
} = require("./services/logtoManagement");

const { getDatabaseHealth } = require("./lib/databaseHealth");
const { getRedisHealth } = require("./lib/redisHealth");

const app = express();
const port = process.env.PORT || 3000;
const API_RESOURCE = process.env.LOGTO_API_RESOURCE_INDICATOR || "https://api.documind.com";

app.use(cors());
app.use(express.json());

const requireOwner = (req, res, next) => {
  const globalRoles = Array.isArray(req.user?.globalRoles) ? req.user.globalRoles : [];
  if (!globalRoles.includes("owner_global")) {
    return res.status(403).json({
      error: "Forbidden",
      message: "This endpoint requires the owner_global role.",
    });
  }
  return next();
};

const summarizeStatus = (statuses) => {
  if (statuses.includes("unhealthy")) return "unhealthy";
  if (statuses.includes("degraded")) return "degraded";
  return "healthy";
};

const getLogtoConfigHealth = () => {
  const required = [
    "LOGTO_ENDPOINT",
    "LOGTO_ISSUER",
    "LOGTO_JWKS_URL",
    "LOGTO_API_RESOURCE_INDICATOR",
    "LOGTO_MANAGEMENT_API_TOKEN_ENDPOINT",
    "LOGTO_MANAGEMENT_API_APPLICATION_ID",
    "LOGTO_MANAGEMENT_API_APPLICATION_SECRET",
    "LOGTO_MANAGEMENT_API_RESOURCE",
  ];
  const missing = required.filter((name) => !process.env[name]);
  return { status: missing.length ? "unhealthy" : "healthy", configured: missing.length === 0, missing };
};

const getWorkerReadiness = () => {
  const configured = Boolean(process.env.SERVICE_URL_WORKER || process.env.REDIS_URL);
  return {
    status: configured ? "healthy" : "degraded",
    serviceUrl: process.env.SERVICE_URL_WORKER || null,
    bullmqPrefix: process.env.BULLMQ_PREFIX || "civitas",
    message: configured ? "Worker bootstrap can use Redis heartbeat and prefixed queues." : "Configure SERVICE_URL_WORKER and REDIS_URL to enable worker runtime health.",
  };
};

app.get("/health", async (_req, res) => {
  const [database, redis] = await Promise.all([getDatabaseHealth(), getRedisHealth()]);
  const logto = getLogtoConfigHealth();
  const worker = getWorkerReadiness();
  const status = summarizeStatus(["healthy", logto.status, database.status, redis.status, worker.status]);
  res.status(status === "unhealthy" ? 503 : 200).json({ status, service: "civitas1.1-backend", api: { status: "healthy" }, logto, database, redis, worker });
});

app.get("/me", requireAuth(API_RESOURCE), (req, res) => {
  const globalRoles = Array.isArray(req.user?.globalRoles) ? req.user.globalRoles : [];
  const organizationRoles = Array.isArray(req.user?.organizationRoles) ? req.user.organizationRoles : [];
  res.json({
    auth: {
      sub: req.user?.sub || req.user?.id || null,
      organizationId: req.user?.organizationId || null,
      scopes: req.user?.scopes || [],
      roles: req.user?.roles || [],
      globalRoles,
      organizationRoles,
      owner: {
        canReadOwner: globalRoles.includes("owner_global"),
        canWriteOwner: globalRoles.includes("owner_global"),
      },
    },
  });
});

app.post(["/owner/organizations", "/organizations"], requireAuth(API_RESOURCE), requireOwner, async (req, res) => {
  try {
    const { name, description, customData } = req.body || {};

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Bad Request", message: "name is required" });
    }

    await ensureOrganizationTemplate();
    const organization = await createLogtoOrganization({
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : undefined,
      customData: customData && typeof customData === "object" ? customData : undefined,
    });

    const adminRole = await findOrganizationRoleByName(ORGANIZATION_ADMIN_ROLE_NAME);
    await addUserToLogtoOrganization({ organizationId: organization.id, userId: req.user.id });

    if (adminRole?.id) {
      await assignOrganizationRoleToUser({
        organizationId: organization.id,
        userId: req.user.id,
        organizationRoleId: adminRole.id,
      });
    }

    return res.status(201).json({
      data: organization,
      bootstrap: {
        firstAdminUserId: req.user.id,
        assignedOrganizationRole: adminRole?.name || ORGANIZATION_ADMIN_ROLE_NAME,
      },
    });
  } catch (error) {
    return res.status(error?.status || 500).json({
      error: error?.name || "OrganizationProvisioningError",
      message: error?.message || "Failed to create organization in Logto",
      code: error?.code || null,
      details: error?.body || null,
    });
  }
});

app.get(
  "/documents",
  requireOrganizationAccess({ requiredScopes: ["read:documents"] }),
  async (req, res) => {
    const documents = [
      {
        id: "1",
        title: "Getting Started Guide",
        updatedAt: "2024-03-15",
        updatedBy: "John Doe",
        preview: "Welcome to DocuMind! This guide will help you understand the basic features...",
      },
      {
        id: "2",
        title: "Product Requirements",
        updatedAt: "2024-03-14",
        updatedBy: "Alice Smith",
        preview: "The new feature should include the following requirements...",
      },
    ];

    res.json(documents);
  }
);

app.post(
  "/documents",
  requireOrganizationAccess({ requiredScopes: ["create:documents"] }),
  async (_req, res) => {
    res.json({ data: "Document created" });
  }
);

app.get("/", (_req, res) => {
  res.json({ message: "Welcome to the Civitas 1.1 API" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
