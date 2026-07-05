import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { validateDeploymentConfig, classifyDeploymentVariable } = require("../core/deployment/deployment-kernel.cjs");

const root = new URL("..", import.meta.url).pathname;
const files = [
  ".env.example",
  "backend/.env.example",
  "frontend/.env.example",
  "docker-compose.yml",
  "frontend/Dockerfile",
  "frontend/src/env.ts",
  "config/civitas.config.ts",
  "backend/index.js",
  "backend/runtime/env.js",
  "runtime/env.js",
  "backend/middleware/auth.js",
  "backend/services/logtoManagement.js",
  "backend/lib/utils.js",
  "backend/connectors/identity/logto/config.js",
];

const deletedNames = [
  ["LOGTO", "ENDPOINT"].join("_"),
  ["LOGTO", "CLIENT", "ID"].join("_"),
  ["LOGTO", "CLIENT", "SECRET"].join("_"),
  ["LOGTO", "MANAGEMENT", "API", "RESOURCE"].join("_"),
  ["LOGTO", "MANAGEMENT", "API", "TOKEN", "ENDPOINT"].join("_"),
  ["LOGTO", "MANAGEMENT", "API", "APPLICATION", "ID"].join("_"),
  ["LOGTO", "MANAGEMENT", "API", "APPLICATION", "SECRET"].join("_"),
  ["VITE", "APP", "REDIRECT", "URI"].join("_"),
  ["VITE", "APP", "SIGNOUT", "REDIRECT", "URI"].join("_"),
  ["VITE", "API", "BASE", "URL"].join("_"),
  ["VITE", "API", "RESOURCE", "INDICATOR"].join("_"),
  ["VITE", "API", "RESOURCE"].join("_"),
  ["VITE", "LOGTO", "API", "RESOURCE"].join("_"),
];
const platformMetadataPatterns = [
  /^SERVICE_/,
  /COOLIFY_/,
];
const banned = [
  new RegExp(["socialstudies", "cloud"].join("\\.")),
  ...deletedNames.map((name) => new RegExp(`(^|[^A-Z0-9_])${name}(?=\\b|[\\s:=])`)),
];

const read = (file) => readFileSync(join(root, file), "utf8");
const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};

for (const file of files) {
  const source = read(file);
  for (const pattern of banned) {
    if (pattern.test(source)) fail(`${file} contains deleted config reference ${pattern}`);
  }
}

const applicationRuntimeFiles = [
  "frontend/src/env.ts",
  "config/civitas.config.ts",
  "backend/index.js",
  "backend/runtime/env.js",
  "runtime/env.js",
  "backend/middleware/auth.js",
  "backend/services/logtoManagement.js",
  "backend/lib/utils.js",
  "backend/connectors/identity/logto/config.js",
];
for (const file of applicationRuntimeFiles) {
  const source = read(file);
  for (const pattern of platformMetadataPatterns) {
    if (pattern.test(source)) fail(`${file} consumes platform metadata ${pattern}; Civitas runtime must not depend on platform-generated variables`);
  }
}

for (const file of [".env.example", "backend/.env.example", "frontend/.env.example", "docker-compose.yml", "frontend/Dockerfile"]) {
  const source = read(file);
  for (const pattern of platformMetadataPatterns) {
    if (pattern.test(source)) fail(`${file} presents platform metadata ${pattern} as Civitas configuration`);
  }
}

const frontendEnv = read("frontend/.env.example");
try { validateDeploymentConfig({ service: "frontend", env: Object.fromEntries(frontendEnv.split(/\r?\n/).filter((line) => line.includes("=") && !line.trim().startsWith("#")).map((line) => line.split(/=(.*)/s).slice(0, 2))) }); } catch (error) { fail(error.message); }
if (/\/backend/.test(frontendEnv)) fail("frontend env must not contain internal backend route");
for (const name of deletedNames.filter((name) => name.startsWith("VITE_APP_"))) {
  if (frontendEnv.includes(`${name}=`)) fail(`frontend env must not require ${name}`);
}

const backendEnv = read("backend/.env.example");
try { validateDeploymentConfig({ service: "backend", env: Object.fromEntries(backendEnv.split(/\r?\n/).filter((line) => line.includes("=") && !line.trim().startsWith("#")).map((line) => line.split(/=(.*)/s).slice(0, 2))) }); } catch (error) { fail(error.message); }

const zeroDriftBackendEnv = Object.fromEntries(backendEnv.split(/\r?\n/).filter((line) => line.includes("=") && !line.trim().startsWith("#")).map((line) => line.split(/=(.*)/s).slice(0, 2)));
zeroDriftBackendEnv.SERVICE_FQDN_API = "civitas.didaxus.com";
zeroDriftBackendEnv.SERVICE_URL_API = "https://civitas.didaxus.com";
zeroDriftBackendEnv.SERVICE_API_INTERNAL = "http://api:3000";
zeroDriftBackendEnv.SERVICE_REGION = "platform-generated";
zeroDriftBackendEnv.COOLIFY_RESOURCE_UUID = "platform-generated";
try {
  const config = validateDeploymentConfig({ service: "backend", env: zeroDriftBackendEnv });
  for (const key of ["SERVICE_FQDN_API", "SERVICE_URL_API", "SERVICE_API_INTERNAL", "SERVICE_REGION", "COOLIFY_RESOURCE_UUID"]) {
    if (!config.ignoredPlatformMetadata.includes(key)) fail(`deployment kernel did not explicitly ignore platform metadata ${key}`);
    if (classifyDeploymentVariable(key, "backend") !== "platform_metadata") fail(`deployment kernel did not classify ${key} as platform metadata`);
  }
} catch (error) { fail(`platform metadata must not break zero-drift runtime: ${error.message}`); }

try {
  validateDeploymentConfig({ service: "backend", env: { ...zeroDriftBackendEnv, LOGTO_CLIENT_ID: "removed" } });
  fail("deployment kernel accepted forbidden Civitas drift variable LOGTO_CLIENT_ID");
} catch (error) {
  if (error.code !== "CONFIG_FORBIDDEN_DRIFT") fail(`LOGTO_CLIENT_ID should fail as forbidden Civitas drift, got ${error.code || error.message}`);
}

const compose = read("docker-compose.yml");
const workerBlock = compose.split(/\n\s*frontend:/)[0].split(/\n\s*worker:/)[1] || "";
for (const forbidden of ["VITE_", "LOGTO_M2M_CLIENT_ID", "LOGTO_M2M_CLIENT_SECRET", "LOGTO_API_RESOURCE", "API_URL"]) {
  if (workerBlock.includes(forbidden)) fail(`worker compose block must not contain ${forbidden}`);
}

if (process.exitCode) process.exit(process.exitCode);
console.log("Civitas env config validated");
