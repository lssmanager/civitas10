const test = require("node:test");
const assert = require("node:assert/strict");
const { RuntimeEnvironmentError, validateRuntimeEnv } = require("../runtime/env");

test("backend startup validation without DATABASE_URL fails clearly", () => {
  assert.throws(() => validateRuntimeEnv({ env: { REDIS_URL: "redis://localhost:6379" } }), (error) => error instanceof RuntimeEnvironmentError && error.message.includes("DATABASE_URL is required"));
});

test("worker startup validation without REDIS_URL fails clearly", () => {
  assert.throws(() => validateRuntimeEnv({ env: { DATABASE_URL: "postgres://localhost/db" }, requireRedis: true }), (error) => error instanceof RuntimeEnvironmentError && error.message.includes("REDIS_URL is required"));
});


test("runtime validation rejects URL-shaped Logto API resources", () => {
  assert.throws(
    () => validateRuntimeEnv({ env: { DATABASE_URL: "postgres://localhost/db", REDIS_URL: "redis://localhost:6379", LOGTO_API_RESOURCE: "https://civitas.didaxus.com/api" }, requireRedis: true }),
    (error) => error instanceof RuntimeEnvironmentError && error.message.includes("logical Logto API resource")
  );
});
