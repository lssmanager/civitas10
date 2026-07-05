"use strict";

const { loadCivitasAuthContract } = require("../auth/contract-loader.cjs");

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
    throw new DeploymentConfigError({ code: "CONFIG_INVALID_FORMAT", service, variable, cause: "resource_must_not_be_url", message: `${variable} must be a logical resource identifier, not an HTTP URL`, hint: `Set ${variable}=urn:civitas:api.` });
  }
  return value;
};

const legacyPatterns = Object.freeze([
  [/^LOGTO_CLIENT_ID$/, "Use LOGTO_M2M_CLIENT_ID."],
  [/^LOGTO_CLIENT_SECRET$/, "Use LOGTO_M2M_CLIENT_SECRET."],
  [/^LOGTO_ENDPOINT$/, "Use VITE_LOGTO_ENDPOINT for frontend metadata; backend uses the compiled contract."],
  [/^LOGTO_MANAGEMENT_API_RESOURCE$/, "Management API resource is compiled in the auth contract."],
  [/^LOGTO_MANAGEMENT_API_TOKEN_ENDPOINT$/, "Token endpoint is derived from the compiled auth contract."],
  [/^LOGTO_MANAGEMENT_API_APPLICATION_ID$/, "Use LOGTO_M2M_CLIENT_ID."],
  [/^LOGTO_MANAGEMENT_API_APPLICATION_SECRET$/, "Use LOGTO_M2M_CLIENT_SECRET."],
  [/^VITE_API_RESOURCE_INDICATOR$/, "Use LOGTO_API_RESOURCE on backend only."],
  [/^VITE_API_BASE_URL$/, "Use VITE_API_URL."],
  [/^VITE_API_RESOURCE$/, "Frontend must not define Logto API resource."],
  [/^VITE_LOGTO_API_RESOURCE$/, "Frontend must not define Logto API resource."],
  [/^SERVICE_FQDN_/, "Coolify service FQDN variables are routing metadata only."],
  [/^SERVICE_URL_/, "Coolify service URL variables are routing metadata only."],
  [/^SERVICE_API_/, "Coolify service API variables are not Civitas runtime config."],
]);

const serviceForbiddenPatterns = {
  frontend: [/^LOGTO_M2M_/, /^LOGTO_API_RESOURCE$/, /^DATABASE_URL$/, /^REDIS_URL$/, /^API_URL$/],
  backend: [/^VITE_/, /^WORKER_CONCURRENCY$/],
  worker: [/^VITE_/, /^LOGTO_/, /^API_URL$/],
};

function detectLegacy(env, service) {
  for (const key of Object.keys(env)) {
    if (String(env[key] || "") && String(env[key]).includes("socialstudies.cloud")) {
      throw new DeploymentConfigError({ code: "CONFIG_LEGACY_VARIABLE", service, variable: key, cause: "legacy_domain_detected", message: `${key} references legacy domain socialstudies.cloud`, hint: "Replace legacy domain references with didaxus.com values." });
    }
    for (const [pattern, hint] of legacyPatterns) {
      if (pattern.test(key)) {
        throw new DeploymentConfigError({ code: "CONFIG_LEGACY_VARIABLE", service, variable: key, cause: "legacy_variable_detected", message: `${key} is not supported`, hint });
      }
    }
    for (const pattern of serviceForbiddenPatterns[service] || []) {
      if (pattern.test(key)) {
        throw new DeploymentConfigError({ code: "CONFIG_FORBIDDEN_ALIAS", service, variable: key, cause: "variable_not_allowed_for_service", message: `${key} is not allowed in ${service}`, hint: `Remove ${key} from the ${service} environment.` });
      }
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
  detectLegacy(env, service);
  return {
    service,
    apiUrl: assertMatchesContract(assertHttpUrl(requireValue(env, "VITE_API_URL", service), "VITE_API_URL", service), contract.api.publicUrl, "VITE_API_URL", service),
    logtoEndpoint: assertMatchesContract(assertNoOidcPath(requireValue(env, "VITE_LOGTO_ENDPOINT", service), "VITE_LOGTO_ENDPOINT", service), contract.logto.issuer, "VITE_LOGTO_ENDPOINT", service),
    logtoAppId: requireValue(env, "VITE_LOGTO_APP_ID", service),
    redirectUri: assertHttpUrl(requireValue(env, "VITE_APP_REDIRECT_URI", service), "VITE_APP_REDIRECT_URI", service),
    signOutRedirectUri: assertHttpUrl(requireValue(env, "VITE_APP_SIGNOUT_REDIRECT_URI", service), "VITE_APP_SIGNOUT_REDIRECT_URI", service),
    logtoResource: assertLogicalResource(contract.logto.apiResource, "CivitasAuthContract.logto.apiResource", service),
  };
}

function validateBackend(env, contract) {
  const service = "backend";
  detectLegacy(env, service);
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
  };
}

function validateWorker(env, contract) {
  const service = "worker";
  detectLegacy(env, service);
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
    contract: Object.freeze({ apiResource: contract.logto.apiResource, apiUrl: contract.api.publicUrl }),
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
  legacyPatterns,
  serviceForbiddenPatterns,
  validateDeploymentConfig,
};
