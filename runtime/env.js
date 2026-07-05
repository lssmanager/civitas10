"use strict";
const { loadCivitasAuthContract } = require("../core/auth/contract-loader.cjs");
const CivitasAuthContract = loadCivitasAuthContract();
const REQUIRED_ENV_VARS = Object.freeze(["DATABASE_URL", "REDIS_URL"]);
class RuntimeEnvironmentError extends Error { constructor(message, missing = []) { super(message); this.name = "RuntimeEnvironmentError"; this.code = "RUNTIME_ENV_INVALID"; this.missing = Object.freeze([...missing]); } }
function missingVars(env, names) { return names.filter((name) => !env[name] || String(env[name]).trim() === ""); }
function createEnvValidationError(missing) { return new RuntimeEnvironmentError(missing.map((name) => `${name} is required`).join("\n"), missing); }
function assertLogicalLogtoApiResource() { const resource = CivitasAuthContract.logto.apiResource; if (!resource || /^https?:\/\//i.test(String(resource))) throw new RuntimeEnvironmentError("Compiled LOGTO API resource must be a logical identifier, not an HTTP URL", ["CivitasAuthContract.logto.apiResource"]); }
function validateRuntimeEnv({ env = process.env, requireRedis = true } = {}) { const required = requireRedis ? REQUIRED_ENV_VARS : Object.freeze(["DATABASE_URL"]); const missing = missingVars(env, required); if (missing.length) throw createEnvValidationError(missing); assertLogicalLogtoApiResource(); return { ok: true, required }; }
function enforceRuntimeEnv(options = {}) { try { const result = validateRuntimeEnv(options); if (require.main === module) console.log(JSON.stringify({ status: "ok", component: "runtime-env", required: result.required })); return result; } catch (error) { console.error(error.message); process.exit(1); } }
if (require.main === module) enforceRuntimeEnv();
module.exports = { REQUIRED_ENV_VARS, RuntimeEnvironmentError, createEnvValidationError, enforceRuntimeEnv, assertLogicalLogtoApiResource, validateRuntimeEnv };
