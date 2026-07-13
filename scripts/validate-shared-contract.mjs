import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadCivitasSharedContract } = require("../core/shared/contract-loader.cjs");
const { validateDeploymentConfig } = require("../core/deployment/deployment-kernel.cjs");
const root = new URL("..", import.meta.url).pathname;
const read = (file) => readFileSync(join(root, file), "utf8");
const fail = (message) => { console.error(message); process.exitCode = 1; };
const shared = loadCivitasSharedContract();
const sharedSource = read("core/shared/civitas-shared.contract.cjs");
const compiled = JSON.parse(read("dist/shared.contract.json"));

if (JSON.stringify(compiled) !== JSON.stringify(shared)) fail("compiled shared contract drifted from source loader");
if (shared.logto.apiResource !== shared.api.publicUrl) fail("shared Logto API resource must equal the public API URL resource indicator");

for (const service of ["frontend", "backend", "worker"]) {
  const env = service === "frontend"
    ? { VITE_API_URL: shared.api.publicUrl, VITE_LOGTO_ENDPOINT: shared.logto.issuer, VITE_LOGTO_APP_ID: "app" }
    : service === "backend"
      ? { API_URL: shared.api.publicUrl, DATABASE_URL: "postgres://u:p@localhost:5432/db", REDIS_URL: "redis://localhost:6379", LOGTO_API_RESOURCE: shared.logto.apiResource, LOGTO_MANAGEMENT_API_RESOURCE: `${shared.logto.issuer}/api`, LOGTO_M2M_CLIENT_ID: "id", LOGTO_M2M_CLIENT_SECRET: "secret" }
      : { DATABASE_URL: "postgres://u:p@localhost:5432/db", REDIS_URL: "redis://localhost:6379" };
  try { validateDeploymentConfig({ service, env, contract: shared }); } catch (error) { fail(`${service} deployment config rejected shared contract: ${error.message}`); }
}

const protectedLiterals = [
  shared.logto.apiResource,
  shared.logto.issuer,
  shared.logto.organizationAudiencePrefix,
  shared.auth.global.ownerRole,
  ...Object.values(shared.auth.global.permissions),
];
const allowedLiteralFiles = new Set([
  "core/shared/civitas-shared.contract.cjs",
  "dist/shared.contract.json",
  "dist/auth.contract.json",
  "docs/shared-contract.md",
  "docs/env.md",
  "README.md",
  "backend/README.md",
  "frontend/README.md",
]);
const scannedFiles = [
  "core/auth/civitas-auth.contract.ts",
  "core/auth/types.ts",
  "core/deployment/deployment-kernel.cjs",
  "config/civitas.config.ts",
  "backend/index.js",
  "backend/middleware/auth.js",
  "backend/services/logtoManagement.js",
  "frontend/src/pages/App/index.tsx",
  "frontend/src/authz/rbacMatrix.ts",
  "frontend/src/env.ts",
  "scripts/validate-auth-contract.mjs",
  "docker-compose.yml",
];
for (const file of scannedFiles) {
  let source;
  try { source = read(file); } catch (error) { if (error?.code === "ENOENT") continue; throw error; }
  if (allowedLiteralFiles.has(file)) continue;
  for (const literal of protectedLiterals) {
    if (source.includes(`"${literal}"`) || source.includes(`'${literal}'`)) fail(`${file} locally redefines shared contract literal ${literal}`);
  }
}
const resourceOccurrences = (sharedSource.match(new RegExp(shared.logto.apiResource.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
if (resourceOccurrences !== 2) fail("shared source must define the canonical API URL and Logto resource URL once each");

if (process.exitCode) process.exit(process.exitCode);
console.log("Civitas shared contract isolation validated");
