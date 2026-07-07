const client = require("./client");
const { createAdapterHealth } = require("../../adapters/contracts");
const { codes, connectorError } = require("../../errors");
const { validateLogtoConfig, sanitizeLogtoConfig } = require("./config");
const actions = ["identity.organization.get", "identity.organization.roles.list", "identity.organization.memberships.list"];
function createLogtoAdapter(config = {}) {
  const adapter = {
    name: "logto",
    capability: "identity",
    provider: "logto",
    version: "1.0.0",
    actions,
    validate() { return validateLogtoConfig(config); },
    async healthCheck() { return createAdapterHealth({ status: validateLogtoConfig(config) ? "HEALTHY" : "DEGRADED", last_successful_ping: validateLogtoConfig(config) ? new Date().toISOString() : null, error: validateLogtoConfig(config) ? undefined : "Logto endpoint or Management API resource not configured" }); },
    async execute(action, input = {}, context = {}) {
      if (!actions.includes(action)) throw connectorError(codes.ACTION_UNSUPPORTED, `Unsupported Logto action ${action}`, { action });
      if (action === "identity.organization.get") return client.getLogtoOrganizationById(input.organizationId || input.logtoOrganizationId);
      if (action === "identity.organization.roles.list") return client.listLogtoOrganizationRoles();
      if (action === "identity.organization.memberships.list" && typeof client.listLogtoOrganizationMemberships === "function") return client.listLogtoOrganizationMemberships(input.organizationId || input.logtoOrganizationId);
      return { action, provider: "logto", config: sanitizeLogtoConfig(config), deferred: true, context: { orgId: context.orgId || null } };
    },
  };
  adapter.healthcheck = adapter.healthCheck;
  adapter.ping = async () => { const health = await adapter.healthCheck(); return { status: health.status.toUpperCase(), latency_ms: health.latency_ms ?? null, last_successful_ping: health.last_successful_ping ?? null }; };
  return adapter;
}
module.exports = { createLogtoAdapter };
