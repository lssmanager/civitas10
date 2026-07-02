"use strict";

const { REQUIRED_ENV_VARS, createEnvValidationError, enforceRuntimeEnv, validateRuntimeEnv } = require("../../runtime/env");

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

module.exports = { REQUIRED_ENV_VARS, enforceRuntimeEnv, requireEnv, validateRuntimeEnv, waitForDatabase };
