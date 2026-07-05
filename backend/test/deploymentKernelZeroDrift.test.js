const test = require("node:test");
const assert = require("node:assert/strict");
const {
  classifyDeploymentVariable,
  validateDeploymentConfig,
} = require("../../core/deployment/deployment-kernel.cjs");

const contract = Object.freeze({
  api: { publicUrl: "https://civitas.didaxus.com/api" },
  logto: {
    issuer: "https://auth.didaxus.com",
    apiResource: "urn:civitas:api",
    managementApi: "https://auth.didaxus.com",
    organizationAudiencePrefix: "urn:logto:organization:",
  },
  auth: { global: { ownerRole: "owner_global" } },
});

const backendEnv = Object.freeze({
  NODE_ENV: "production",
  API_URL: "https://civitas.didaxus.com/api",
  DATABASE_URL: "postgresql://civitas:change-me@postgres:5432/civitas",
  REDIS_URL: "redis://redis:6379/0",
  LOGTO_API_RESOURCE: "urn:civitas:api",
  LOGTO_M2M_CLIENT_ID: "m2m-client",
  LOGTO_M2M_CLIENT_SECRET: "m2m-secret",
  BULLMQ_PREFIX: "civitas",
  RUN_MIGRATIONS_ON_STARTUP: "false",
  DATABASE_WAIT_TIMEOUT_MS: "60000",
  DATABASE_WAIT_INTERVAL_MS: "2000",
  DATABASE_CONNECT_TIMEOUT_MS: "5000",
});

test("deployment kernel ignores platform metadata without accepting it as Civitas contract", () => {
  const config = validateDeploymentConfig({
    service: "backend",
    contract,
    env: {
      ...backendEnv,
      SERVICE_FQDN_API: "civitas.didaxus.com",
      SERVICE_URL_API: "https://civitas.didaxus.com",
      SERVICE_API_INTERNAL: "http://api:3000",
      COOLIFY_RESOURCE_UUID: "platform-generated",
    },
  });

  assert.deepEqual(config.ignoredPlatformMetadata, [
    "COOLIFY_RESOURCE_UUID",
    "SERVICE_API_INTERNAL",
    "SERVICE_FQDN_API",
    "SERVICE_URL_API",
  ]);
  assert.equal(classifyDeploymentVariable("SERVICE_FQDN_API", "backend"), "platform_metadata");
  assert.equal(classifyDeploymentVariable("COOLIFY_RESOURCE_UUID", "backend"), "platform_metadata");
});

test("deployment kernel still rejects removed Civitas aliases", () => {
  assert.throws(
    () => validateDeploymentConfig({ service: "backend", contract, env: { ...backendEnv, LOGTO_CLIENT_ID: "old" } }),
    (error) => error.code === "CONFIG_FORBIDDEN_DRIFT" && error.cause === "forbidden_civitas_drift_variable",
  );
});

test("deployment kernel still rejects Civitas variables outside the service contract", () => {
  assert.throws(
    () => validateDeploymentConfig({ service: "worker", contract, env: { ...backendEnv, WORKER_CONCURRENCY: "1" } }),
    (error) => error.code === "CONFIG_OUTSIDE_CONTRACT" && error.variable === "API_URL",
  );
});
