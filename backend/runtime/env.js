"use strict";

const { validateDeploymentConfig } = require("../../core/deployment/deployment-kernel.cjs");

const REQUIRED_ENV_VARS = Object.freeze(["DATABASE_URL", "REDIS_URL"]);

class RuntimeEnvironmentError extends Error {
  constructor(message, missing = []) {
    super(message);
    this.name = "RuntimeEnvironmentError";
    this.code = "RUNTIME_ENV_INVALID";
    this.missing = Object.freeze([...missing]);
  }
}

function missingVars(env, names) {
  return names.filter((name) => !env[name] || String(env[name]).trim() === "");
}

function createEnvValidationError(missing) {
  return new RuntimeEnvironmentError(missing.map((name) => `${name} is required`).join("\n"), missing);
}


function validateRuntimeEnv({ env = process.env, requireRedis = true } = {}) {
  const required = requireRedis ? REQUIRED_ENV_VARS : Object.freeze(["DATABASE_URL"]);
  const missing = missingVars(env, required);
  if (missing.length) {
    throw createEnvValidationError(missing);
  }
  validateDeploymentConfig({ service: requireRedis ? "worker" : "backend", env });
  return { ok: true, required };
}

function enforceRuntimeEnv(options = {}) {
  try {
    const result = validateRuntimeEnv(options);
    if (require.main === module) {
      console.log(JSON.stringify({ status: "ok", component: "runtime-env", required: result.required }));
    }
    return result;
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

function requireEnv(name) {
  if (!process.env[name]) {
    throw createEnvValidationError([name]);
  }
  return process.env[name];
}

async function waitForDatabase({ ping, timeoutMs = Number(process.env.DATABASE_WAIT_TIMEOUT_MS || 30000), intervalMs = Number(process.env.DATABASE_WAIT_INTERVAL_MS || 1000) } = {}) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started <= timeoutMs) {
    try {
      await ping();
      return { ok: true, waitedMs: Date.now() - started };
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  throw new Error(`Database was not ready after ${timeoutMs}ms: ${lastError?.message || "unknown error"}`);
}

if (require.main === module) {
  enforceRuntimeEnv();
}

module.exports = {
  REQUIRED_ENV_VARS,
  RuntimeEnvironmentError,
  createEnvValidationError,
  enforceRuntimeEnv,
  requireEnv,
  validateRuntimeEnv,
  waitForDatabase,
};
