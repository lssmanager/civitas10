const { validateDeploymentConfig } = require("../../../../core/deployment/deployment-kernel.cjs");
const deploymentConfig = validateDeploymentConfig({ service: "backend" });

const normalizeLogtoEndpoint = (endpoint) => endpoint.replace(/\/+$/, "").replace(/\/oidc$/, "");

function resolveLogtoConfig(config = {}) {
  const endpoint = normalizeLogtoEndpoint(config.endpoint || deploymentConfig.logtoManagementApi || "");

  return {
    endpoint: endpoint || null,
    managementTokenEndpoint: endpoint ? `${endpoint}/oidc/token` : null,
    applicationId: config.applicationId || process.env.LOGTO_M2M_CLIENT_ID || null,
    applicationSecret: config.applicationSecret || process.env.LOGTO_M2M_CLIENT_SECRET || null,
    resource: config.managementApiResource || deploymentConfig.logtoManagementApi || null,
    timeoutMs: Number(config.timeoutMs || 8000),
  };
}
function validateLogtoConfig(config = {}) { const c = resolveLogtoConfig(config); return Boolean(c.endpoint && c.resource); }
function sanitizeLogtoConfig(config = {}) { const c = resolveLogtoConfig(config); return { ...c, applicationSecret: c.applicationSecret ? "[redacted]" : null }; }
module.exports = { resolveLogtoConfig, sanitizeLogtoConfig, validateLogtoConfig };
