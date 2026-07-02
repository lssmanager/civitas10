"use strict";

const REQUIRED_ENV_VARS = Object.freeze([
  "DATABASE_URL",
  "REDIS_URL",
  "LOGTO_ENDPOINT",
  "LOGTO_CLIENT_ID",
  "LOGTO_CLIENT_SECRET",
  "NODE_ENV",
]);

function isBlank(value) {
  return typeof value !== "string" || value.trim() === "";
}

function buildMissingEnvMessage(missing) {
  return [
    "Civitas runtime environment validation failed.",
    `Missing required environment variable${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}.`,
    "Define all required infrastructure and Logto variables in the deployment environment before starting API or worker containers.",
    "Required variables: DATABASE_URL, REDIS_URL, LOGTO_ENDPOINT, LOGTO_CLIENT_ID, LOGTO_CLIENT_SECRET, NODE_ENV.",
  ].join(" ");
}

function createEnvValidationError(missing) {
  const error = new Error(buildMissingEnvMessage(missing));
  error.name = "RuntimeEnvironmentError";
  error.code = "RUNTIME_ENV_INVALID";
  error.missing = Object.freeze([...missing]);
  return error;
}

function validateRuntimeEnv(env = process.env) {
  const missing = REQUIRED_ENV_VARS.filter((name) => isBlank(env[name]));
  if (missing.length > 0) {
    throw createEnvValidationError(missing);
  }
  return Object.freeze({
    ok: true,
    required: REQUIRED_ENV_VARS,
  });
}

function enforceRuntimeEnv(env = process.env) {
  try {
    const result = validateRuntimeEnv(env);
    if (require.main === module) {
      console.log(JSON.stringify({ status: "ok", component: "runtime-env", required: result.required }));
    }
    return result;
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  enforceRuntimeEnv();
}

module.exports = {
  REQUIRED_ENV_VARS,
  createEnvValidationError,
  enforceRuntimeEnv,
  validateRuntimeEnv,
};
