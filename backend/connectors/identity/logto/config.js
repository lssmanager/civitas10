const normalizeLogtoEndpoint = (endpoint) => endpoint.replace(/\/+$/, "").replace(/\/oidc$/, "");

function resolveLogtoConfig(config = {}) {
  const endpoint = normalizeLogtoEndpoint(config.endpoint || process.env.LOGTO_ENDPOINT || "");

  return {
    endpoint: endpoint || null,
    managementTokenEndpoint: endpoint ? `${endpoint}/oidc/token` : null,
    applicationId: config.applicationId || process.env.LOGTO_CLIENT_ID || null,
    applicationSecret: config.applicationSecret || process.env.LOGTO_CLIENT_SECRET || null,
    resource: endpoint ? `${endpoint}/api` : null,
    timeoutMs: Number(config.timeoutMs || 8000),
  };
}
function validateLogtoConfig(config = {}) { const c = resolveLogtoConfig(config); return Boolean(c.endpoint); }
function sanitizeLogtoConfig(config = {}) { const c = resolveLogtoConfig(config); return { ...c, applicationSecret: c.applicationSecret ? "[redacted]" : null }; }
module.exports = { resolveLogtoConfig, sanitizeLogtoConfig, validateLogtoConfig };
