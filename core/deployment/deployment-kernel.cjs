"use strict";

const { loadCivitasAuthContract } = require("../shared/contract-loader.cjs");

class DeploymentConfigError extends Error {
  constructor({ code, message, variable, cause, hint, service }) {
    super(message);
    this.name = "DeploymentConfigError";
    this.code = code;
    this.variable = variable || null;
    this.cause = cause || null;
    this.hint = hint || null;
    this.service = service || null;
  }
}

const asInt = (value, variable, service) => {
  if (!/^\d+$/.test(String(value || ""))) {
    throw new DeploymentConfigError({ code: "CONFIG_INVALID_FORMAT", service, variable, cause: "expected_integer", message: `${variable} must be an integer`, hint: `Set ${variable} to a positive integer.` });
  }
  return Number(value);
};

const asBool = (value, variable, service) => {
  if (!["true", "false"].includes(String(value))) {
    throw new DeploymentConfigError({ code: "CONFIG_INVALID_FORMAT", service, variable, cause: "expected_boolean", message: `${variable} must be true or false`, hint: `Set ${variable}=true or ${variable}=false.` });
  }
  return String(value) === "true";
};

const requireValue = (env, variable, service) => {
  const value = env[variable];
  if (value == null || String(value).trim() === "") {
    throw new DeploymentConfigError({ code: "CONFIG_MISSING", service, variable, cause: "missing_required_variable", message: `${variable} is required for ${service}`, hint: `Define ${variable} in the ${service} deployment environment.` });
  }
  return String(value).trim();
};

const assertHttpUrl = (value, variable, service) => {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("invalid_protocol");
    return value.replace(/\/+$/, "");
  } catch {
    throw new DeploymentConfigError({ code: "CONFIG_INVALID_FORMAT", service, variable, cause: "expected_http_url", message: `${variable} must be an HTTP URL`, hint: `Use a full http(s) URL for ${variable}.` });
  }
};

const assertNoOidcPath = (value, variable, service) => {
  const url = new URL(assertHttpUrl(value, variable, service));
  if (url.pathname.replace(/\/+$/, "") === "/oidc") {
    throw new DeploymentConfigError({ code: "CONFIG_INVALID_FORMAT", service, variable, cause: "endpoint_must_be_base_url", message: `${variable} must be the Logto base endpoint, not /oidc`, hint: `Use ${url.origin} for ${variable}.` });
  }
  return url.origin;
};

const assertLogicalResource = (value, variable, service) => {
  if (/^https?:\/\//i.test(value)) {
    throw new DeploymentConfigError({ code: "CONFIG_INVALID_FORMAT", service, variable, cause: "resource_must_not_be_url", message: `${variable} must be a logical resource identifier, not an HTTP URL`, hint: `Set ${variable} to CivitasSharedContract.logto.apiResource.` });
  }
  return value;
};

const serviceAllowedVariables = Object.freeze({
  frontend: new Set(["VITE_API_URL", "VITE_LOGTO_ENDPOINT", "VITE_LOGTO_APP_ID"]),
  backend: new Set(["NODE_ENV", "API_URL", "DATABASE_URL", "REDIS_URL", "LOGTO_API_RESOURCE", "LOGTO_M2M_CLIENT_ID", "LOGTO_M2M_CLIENT_SECRET", "BULLMQ_PREFIX", "RUN_MIGRATIONS_ON_STARTUP", "DATABASE_WAIT_TIMEOUT_MS", "DATABASE_WAIT_INTERVAL_MS", "DATABASE_CONNECT_TIMEOUT_MS"]),
  worker: new Set(["NODE_ENV", "DATABASE_URL", "REDIS_URL", "BULLMQ_PREFIX", "WORKER_CONCURRENCY", "ENABLE_QUEUE_RECONCILER", "ENABLE_DB_POLL_EXECUTION", "RUN_MIGRATIONS_ON_STARTUP", "DATABASE_WAIT_TIMEOUT_MS", "DATABASE_WAIT_INTERVAL_MS", "DATABASE_CONNECT_TIMEOUT_MS"]),
});

const civitasVariablePatterns = Object.freeze([
  /^VITE_/, /^LOGTO_/, /^DATABASE_URL$/, /^REDIS_URL$/, /^API_URL$/, /^BULLMQ_PREFIX$/,
  /^WORKER_CONCURRENCY$/, /^ENABLE_QUEUE_RECONCILER$/, /^ENABLE_DB_POLL_EXECUTION$/,
  /^RUN_MIGRATIONS_ON_STARTUP$/, /^DATABASE_WAIT_TIMEOUT_MS$/, /^DATABASE_WAIT_INTERVAL_MS$/,
  /^DATABASE_CONNECT_TIMEOUT_MS$/, new RegExp(`^${["SERVICE", "FQDN"].join("_")}_`), new RegExp(`^${["SERVICE", "URL"].join("_")}_`), new RegExp(`^${["SERVICE", "API"].join("_")}_`), /^API_BASE_URL$/,
]);

function assertStrictServiceContract(env, service) {
  const allowed = serviceAllowedVariables[service];
  for (const key of Object.keys(env)) {
    if (String(env[key] || "").includes(["socialstudies", "cloud"].join("."))) {
      throw new DeploymentConfigError({ code: "CONFIG_OUTSIDE_CONTRACT", service, variable: key, cause: "removed_domain_detected", message: `${key} references a removed domain`, hint: "Use the current Civitas deployment domains." });
    }
    if (!civitasVariablePatterns.some((pattern) => pattern.test(key))) continue;
    if (!allowed.has(key)) {
      throw new DeploymentConfigError({ code: "CONFIG_OUTSIDE_CONTRACT", service, variable: key, cause: "variable_outside_service_contract", message: `${key} is outside the ${service} configuration contract`, hint: `Remove ${key} from the ${service} environment.` });
    }
  }
}

function assertMatchesContract(value, expected, variable, service) {
  if (value !== expected) {
    throw new DeploymentConfigError({ code: "CONFIG_CONTRACT_MISMATCH", service, variable, cause: "runtime_env_drift", message: `${variable} does not match the compiled Civitas auth contract`, hint: `Set ${variable}=${expected}.` });
  }
  return value;
}

function validateFrontend(env, contract) {
  const service = "frontend";
  assertStrictServiceContract(env, service);
  return {
    service,
    apiUrl: assertMatchesContract(assertHttpUrl(requireValue(env, "VITE_API_URL", service), "VITE_API_URL", service), contract.api.publicUrl, "VITE_API_URL", service),
    logtoEndpoint: assertMatchesContract(assertNoOidcPath(requireValue(env, "VITE_LOGTO_ENDPOINT", service), "VITE_LOGTO_ENDPOINT", service), contract.logto.issuer, "VITE_LOGTO_ENDPOINT", service),
    logtoAppId: requireValue(env, "VITE_LOGTO_APP_ID", service),
    logtoResource: assertLogicalResource(contract.logto.apiResource, "CivitasSharedContract.logto.apiResource", service),
  };
}

function validateBackend(env, contract) {
  const service = "backend";
  assertStrictServiceContract(env, service);
  return {
    service,
    nodeEnv: env.NODE_ENV || "production",
    apiUrl: assertMatchesContract(assertHttpUrl(requireValue(env, "API_URL", service), "API_URL", service), contract.api.publicUrl, "API_URL", service),
    databaseUrl: requireValue(env, "DATABASE_URL", service),
    redisUrl: requireValue(env, "REDIS_URL", service),
    logtoResource: assertMatchesContract(assertLogicalResource(requireValue(env, "LOGTO_API_RESOURCE", service), "LOGTO_API_RESOURCE", service), contract.logto.apiResource, "LOGTO_API_RESOURCE", service),
    m2mClientId: requireValue(env, "LOGTO_M2M_CLIENT_ID", service),
    m2mClientSecret: requireValue(env, "LOGTO_M2M_CLIENT_SECRET", service),
    logtoEndpoint: contract.logto.issuer,
    logtoManagementApi: contract.logto.managementApi,
    bullmqPrefix: env.BULLMQ_PREFIX || "civitas",
    runMigrationsOnStartup: asBool(env.RUN_MIGRATIONS_ON_STARTUP || "false", "RUN_MIGRATIONS_ON_STARTUP", service),
    databaseWaitTimeoutMs: asInt(env.DATABASE_WAIT_TIMEOUT_MS || "60000", "DATABASE_WAIT_TIMEOUT_MS", service),
    databaseWaitIntervalMs: asInt(env.DATABASE_WAIT_INTERVAL_MS || "2000", "DATABASE_WAIT_INTERVAL_MS", service),
    databaseConnectTimeoutMs: asInt(env.DATABASE_CONNECT_TIMEOUT_MS || "5000", "DATABASE_CONNECT_TIMEOUT_MS", service),
    contract: Object.freeze({ apiResource: contract.logto.apiResource, apiUrl: contract.api.publicUrl, organizationAudiencePrefix: contract.logto.organizationAudiencePrefix, auth: contract.auth }),
  };
}

function validateWorker(env, contract) {
  const service = "worker";
  assertStrictServiceContract(env, service);
  return {
    service,
    nodeEnv: env.NODE_ENV || "production",
    databaseUrl: requireValue(env, "DATABASE_URL", service),
    redisUrl: requireValue(env, "REDIS_URL", service),
    bullmqPrefix: env.BULLMQ_PREFIX || "civitas",
    workerConcurrency: asInt(env.WORKER_CONCURRENCY || "1", "WORKER_CONCURRENCY", service),
    enableQueueReconciler: asBool(env.ENABLE_QUEUE_RECONCILER || "true", "ENABLE_QUEUE_RECONCILER", service),
    enableDbPollExecution: asBool(env.ENABLE_DB_POLL_EXECUTION || "false", "ENABLE_DB_POLL_EXECUTION", service),
    runMigrationsOnStartup: asBool(env.RUN_MIGRATIONS_ON_STARTUP || "false", "RUN_MIGRATIONS_ON_STARTUP", service),
    databaseWaitTimeoutMs: asInt(env.DATABASE_WAIT_TIMEOUT_MS || "60000", "DATABASE_WAIT_TIMEOUT_MS", service),
    databaseWaitIntervalMs: asInt(env.DATABASE_WAIT_INTERVAL_MS || "2000", "DATABASE_WAIT_INTERVAL_MS", service),
    databaseConnectTimeoutMs: asInt(env.DATABASE_CONNECT_TIMEOUT_MS || "5000", "DATABASE_CONNECT_TIMEOUT_MS", service),
    contract: Object.freeze({ apiResource: contract.logto.apiResource, apiUrl: contract.api.publicUrl, organizationAudiencePrefix: contract.logto.organizationAudiencePrefix, auth: contract.auth }),
  };
}

function validateDeploymentConfig({ service, env = process.env, contract = loadCivitasAuthContract() } = {}) {
  if (!service) throw new DeploymentConfigError({ code: "CONFIG_INVALID_FORMAT", variable: "service", cause: "missing_service", message: "Deployment service is required", hint: "Pass service=frontend, backend, or worker." });
  if (service === "frontend") return validateFrontend(env, contract);
  if (service === "backend") return validateBackend(env, contract);
  if (service === "worker") return validateWorker(env, contract);
  throw new DeploymentConfigError({ code: "CONFIG_INVALID_FORMAT", variable: "service", cause: "unknown_service", message: `Unknown deployment service: ${service}`, hint: "Use frontend, backend, or worker." });
}

module.exports = {
  DeploymentConfigError,
  serviceAllowedVariables,
  validateDeploymentConfig,
};
