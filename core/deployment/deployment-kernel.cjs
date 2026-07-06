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

const assertUrlResource = (value, variable, service) => assertHttpUrl(value, variable, service);

const serviceAllowedVariables = Object.freeze({
  frontend: new Set(["VITE_API_URL", "VITE_LOGTO_ENDPOINT", "VITE_LOGTO_APP_ID"]),
  backend: new Set(["NODE_ENV", "API_URL", "DATABASE_URL", "REDIS_URL", "LOGTO_API_RESOURCE", "LOGTO_MANAGEMENT_API_RESOURCE", "LOGTO_M2M_CLIENT_ID", "LOGTO_M2M_CLIENT_SECRET", "BULLMQ_PREFIX", "RUN_MIGRATIONS_ON_STARTUP", "DATABASE_WAIT_TIMEOUT_MS", "DATABASE_WAIT_INTERVAL_MS", "DATABASE_CONNECT_TIMEOUT_MS"]),
  worker: new Set(["NODE_ENV", "DATABASE_URL", "REDIS_URL", "BULLMQ_PREFIX", "WORKER_CONCURRENCY", "ENABLE_QUEUE_RECONCILER", "ENABLE_DB_POLL_EXECUTION", "RUN_MIGRATIONS_ON_STARTUP", "DATABASE_WAIT_TIMEOUT_MS", "DATABASE_WAIT_INTERVAL_MS", "DATABASE_CONNECT_TIMEOUT_MS", "WORKER_JOB_ATTEMPTS", "WORKER_JOB_BACKOFF_MS", "WORKER_REMOVE_ON_COMPLETE", "WORKER_REMOVE_ON_FAIL"]),
});


const serviceContractOwners = (() => {
  const owners = new Map();
  for (const [service, variables] of Object.entries(serviceAllowedVariables)) {
    for (const variable of variables) {
      if (!owners.has(variable)) owners.set(variable, new Set());
      owners.get(variable).add(service);
    }
  }
  return owners;
})();

const isCrossServiceVariable = (key, service) => {
  const owners = serviceContractOwners.get(key);
  return Boolean(owners && !owners.has(service));
};

const platformMetadataVariablePatterns = Object.freeze([
  /^SERVICE_[A-Z0-9_]+$/,
  /^COOLIFY_[A-Z0-9_]+$/,
]);

const forbiddenCivitasVariables = Object.freeze(new Set([
  "LOGTO_CLIENT_ID",
  "LOGTO_CLIENT_SECRET",
  "LOGTO_ENDPOINT",
  "LOGTO_MANAGEMENT_API_TOKEN_ENDPOINT",
  "LOGTO_MANAGEMENT_API_APPLICATION_ID",
  "LOGTO_MANAGEMENT_API_APPLICATION_SECRET",
  "VITE_APP_REDIRECT_URI",
  "VITE_APP_SIGNOUT_REDIRECT_URI",
  "VITE_API_RESOURCE_INDICATOR",
  "VITE_API_BASE_URL",
  "VITE_API_RESOURCE",
  "VITE_LOGTO_API_RESOURCE",
]));

const civitasVariablePatterns = Object.freeze([
  /^VITE_/, /^LOGTO_/, /^DATABASE_URL$/, /^REDIS_URL$/, /^API_URL$/, /^BULLMQ_PREFIX$/,
  /^WORKER_CONCURRENCY$/, /^ENABLE_QUEUE_RECONCILER$/, /^ENABLE_DB_POLL_EXECUTION$/,
  /^RUN_MIGRATIONS_ON_STARTUP$/, /^DATABASE_WAIT_TIMEOUT_MS$/, /^DATABASE_WAIT_INTERVAL_MS$/, /^DATABASE_CONNECT_TIMEOUT_MS$/, /^WORKER_JOB_ATTEMPTS$/, /^WORKER_JOB_BACKOFF_MS$/, /^WORKER_REMOVE_ON_COMPLETE$/, /^WORKER_REMOVE_ON_FAIL$/, /^API_BASE_URL$/,
]);

const isPlatformMetadataVariable = (key) => platformMetadataVariablePatterns.some((pattern) => pattern.test(key));
const isCivitasVariable = (key) => civitasVariablePatterns.some((pattern) => pattern.test(key));

function classifyDeploymentVariable(key, service) {
  if (serviceAllowedVariables[service]?.has(key)) return "contract";
  if (isPlatformMetadataVariable(key)) return "platform_metadata";
  if (forbiddenCivitasVariables.has(key)) return "forbidden_civitas_drift";
  if (isCrossServiceVariable(key, service)) return "cross_service_pollution";
  if (isCivitasVariable(key)) return "civitas_outside_service_contract";
  return "external_runtime";
}

function assertStrictServiceContract(env, service, { enforceCrossServicePollution = false } = {}) {
  const ignoredPlatformMetadata = [];
  const ignoredCrossServicePollution = [];
  for (const key of Object.keys(env)) {
    if (String(env[key] || "").includes(["socialstudies", "cloud"].join("."))) {
      throw new DeploymentConfigError({ code: "CONFIG_FORBIDDEN_DRIFT", service, variable: key, cause: "removed_domain_detected", message: `${key} references removed Civitas domain drift`, hint: "Use the current Civitas deployment domains." });
    }
    const classification = classifyDeploymentVariable(key, service);
    if (classification === "platform_metadata") {
      ignoredPlatformMetadata.push(key);
      continue;
    }
    if (classification === "forbidden_civitas_drift") {
      throw new DeploymentConfigError({ code: "CONFIG_FORBIDDEN_DRIFT", service, variable: key, cause: "forbidden_civitas_drift_variable", message: `${key} is forbidden Civitas configuration drift`, hint: `Remove ${key}; it belongs to a removed Civitas configuration model.` });
    }
    if (classification === "cross_service_pollution") {
      if (enforceCrossServicePollution) {
        throw new DeploymentConfigError({ code: "CONFIG_CROSS_SERVICE_POLLUTION", service, variable: key, cause: "cross_service_pollution", message: `${key} belongs to another Civitas service contract and is forbidden in ${service}`, hint: `Remove ${key} from the ${service} environment in Coolify.` });
      }
      ignoredCrossServicePollution.push(key);
      continue;
    }
    if (classification === "civitas_outside_service_contract") {
      throw new DeploymentConfigError({ code: "CONFIG_OUTSIDE_CONTRACT", service, variable: key, cause: "variable_outside_service_contract", message: `${key} is outside the ${service} configuration contract`, hint: `Remove ${key} from the ${service} environment.` });
    }
  }
  return Object.freeze({
    ignoredPlatformMetadata: Object.freeze(ignoredPlatformMetadata.sort()),
    ignoredCrossServicePollution: Object.freeze(ignoredCrossServicePollution.sort()),
  });
}

function assertMatchesContract(value, expected, variable, service) {
  if (value !== expected) {
    throw new DeploymentConfigError({ code: "CONFIG_CONTRACT_MISMATCH", service, variable, cause: "runtime_env_drift", message: `${variable} does not match the compiled Civitas auth contract`, hint: `Set ${variable}=${expected}.` });
  }
  return value;
}


const resolveBackendLogtoResource = (env, contract, service) => ({
  logtoResource: assertMatchesContract(assertUrlResource(requireValue(env, "LOGTO_API_RESOURCE", service), "LOGTO_API_RESOURCE", service), contract.logto.apiResource, "LOGTO_API_RESOURCE", service),
  ignoredContractDrift: [],
});

function validateFrontend(env, contract, options) {
  const service = "frontend";
  const { ignoredPlatformMetadata, ignoredCrossServicePollution } = assertStrictServiceContract(env, service, options);
  return {
    service,
    ignoredPlatformMetadata,
    ignoredCrossServicePollution,
    apiUrl: assertMatchesContract(assertHttpUrl(requireValue(env, "VITE_API_URL", service), "VITE_API_URL", service), contract.api.publicUrl, "VITE_API_URL", service),
    logtoEndpoint: assertMatchesContract(assertNoOidcPath(requireValue(env, "VITE_LOGTO_ENDPOINT", service), "VITE_LOGTO_ENDPOINT", service), contract.logto.issuer, "VITE_LOGTO_ENDPOINT", service),
    logtoAppId: requireValue(env, "VITE_LOGTO_APP_ID", service),
    logtoResource: assertUrlResource(contract.logto.apiResource, "CivitasSharedContract.logto.apiResource", service),
  };
}

function validateBackend(env, contract, options) {
  const service = "backend";
  const { ignoredPlatformMetadata, ignoredCrossServicePollution } = assertStrictServiceContract(env, service, options);
  const { logtoResource, ignoredContractDrift } = resolveBackendLogtoResource(env, contract, service, options);
  return {
    service,
    ignoredPlatformMetadata,
    ignoredCrossServicePollution,
    ignoredContractDrift: Object.freeze(ignoredContractDrift.sort()),
    nodeEnv: env.NODE_ENV || "production",
    apiUrl: assertMatchesContract(assertHttpUrl(requireValue(env, "API_URL", service), "API_URL", service), contract.api.publicUrl, "API_URL", service),
    databaseUrl: requireValue(env, "DATABASE_URL", service),
    redisUrl: requireValue(env, "REDIS_URL", service),
    logtoResource,
    m2mClientId: requireValue(env, "LOGTO_M2M_CLIENT_ID", service),
    m2mClientSecret: requireValue(env, "LOGTO_M2M_CLIENT_SECRET", service),
    logtoEndpoint: contract.logto.issuer,
    logtoManagementApi: assertUrlResource(requireValue(env, "LOGTO_MANAGEMENT_API_RESOURCE", service), "LOGTO_MANAGEMENT_API_RESOURCE", service),
    bullmqPrefix: env.BULLMQ_PREFIX || "civitas",
    runMigrationsOnStartup: asBool(env.RUN_MIGRATIONS_ON_STARTUP || "false", "RUN_MIGRATIONS_ON_STARTUP", service),
    databaseWaitTimeoutMs: asInt(env.DATABASE_WAIT_TIMEOUT_MS || "60000", "DATABASE_WAIT_TIMEOUT_MS", service),
    databaseWaitIntervalMs: asInt(env.DATABASE_WAIT_INTERVAL_MS || "2000", "DATABASE_WAIT_INTERVAL_MS", service),
    databaseConnectTimeoutMs: asInt(env.DATABASE_CONNECT_TIMEOUT_MS || "5000", "DATABASE_CONNECT_TIMEOUT_MS", service),
    contract: Object.freeze({ apiResource: contract.logto.apiResource, apiUrl: contract.api.publicUrl, organizationAudiencePrefix: contract.logto.organizationAudiencePrefix, auth: contract.auth }),
  };
}

function validateWorker(env, contract, options) {
  const service = "worker";
  const { ignoredPlatformMetadata, ignoredCrossServicePollution } = assertStrictServiceContract(env, service, options);
  return {
    service,
    ignoredPlatformMetadata,
    ignoredCrossServicePollution,
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
    workerJobAttempts: asInt(env.WORKER_JOB_ATTEMPTS || "3", "WORKER_JOB_ATTEMPTS", service),
    workerJobBackoffMs: asInt(env.WORKER_JOB_BACKOFF_MS || "5000", "WORKER_JOB_BACKOFF_MS", service),
    workerRemoveOnComplete: asInt(env.WORKER_REMOVE_ON_COMPLETE || "1000", "WORKER_REMOVE_ON_COMPLETE", service),
    workerRemoveOnFail: asInt(env.WORKER_REMOVE_ON_FAIL || "5000", "WORKER_REMOVE_ON_FAIL", service),
    contract: Object.freeze({ apiResource: contract.logto.apiResource, apiUrl: contract.api.publicUrl, organizationAudiencePrefix: contract.logto.organizationAudiencePrefix, auth: contract.auth }),
  };
}

function validateDeploymentConfig({ service, env = process.env, contract = loadCivitasAuthContract(), enforceCrossServicePollution = false, enforceContractEnvDrift = false } = {}) {
  const options = { enforceCrossServicePollution, enforceContractEnvDrift };
  if (!service) throw new DeploymentConfigError({ code: "CONFIG_INVALID_FORMAT", variable: "service", cause: "missing_service", message: "Deployment service is required", hint: "Pass service=frontend, backend, or worker." });
  if (service === "frontend") return validateFrontend(env, contract, options);
  if (service === "backend") return validateBackend(env, contract, options);
  if (service === "worker") return validateWorker(env, contract, options);
  throw new DeploymentConfigError({ code: "CONFIG_INVALID_FORMAT", variable: "service", cause: "unknown_service", message: `Unknown deployment service: ${service}`, hint: "Use frontend, backend, or worker." });
}

module.exports = {
  DeploymentConfigError,
  classifyDeploymentVariable,
  forbiddenCivitasVariables,
  platformMetadataVariablePatterns,
  serviceContractOwners,
  serviceAllowedVariables,
  validateDeploymentConfig,
};
