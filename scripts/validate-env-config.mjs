import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { validateDeploymentConfig } = require("../core/deployment/deployment-kernel.cjs");

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

const banned = [
  /SERVICE_URL_(BACKEND|FRONTEND|WORKER)/,
  /SERVICE_FQDN_/,
  /SERVICE_API_/,
  /API_BASE_URL/,
  /VITE_API_BASE_URL/,
  /VITE_API_RESOURCE=/,
  /VITE_LOGTO_API_RESOURCE=/,
  /LOGTO_CLIENT_ID/,
  /LOGTO_CLIENT_SECRET/,
  /LOGTO_MANAGEMENT_API_APPLICATION_/,
  /LOGTO_MANAGEMENT_API_RESOURCE\s*[=:]/,
  /VITE_LOGTO_MANAGEMENT_API_RESOURCE/,
];

const read = (file) => readFileSync(join(root, file), "utf8");
const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};

for (const file of files) {
  const source = read(file);
  for (const pattern of banned) {
    if (pattern.test(source)) fail(`${file} contains banned env alias ${pattern}`);
  }
}

const frontendEnv = read("frontend/.env.example");
try { validateDeploymentConfig({ service: "frontend", env: Object.fromEntries(frontendEnv.split(/\r?\n/).filter((line) => line.includes("=") && !line.trim().startsWith("#")).map((line) => line.split(/=(.*)/s).slice(0, 2))) }); } catch (error) { fail(error.message); }
if (/\/backend/.test(frontendEnv)) fail("frontend env must not contain Coolify /backend internal route");

const backendEnv = read("backend/.env.example");
try { validateDeploymentConfig({ service: "backend", env: Object.fromEntries(backendEnv.split(/\r?\n/).filter((line) => line.includes("=") && !line.trim().startsWith("#")).map((line) => line.split(/=(.*)/s).slice(0, 2))) }); } catch (error) { fail(error.message); }

const compose = read("docker-compose.yml");
const workerBlock = compose.split(/\n\s*frontend:/)[0].split(/\n\s*worker:/)[1] || "";
for (const forbidden of ["VITE_", "LOGTO_M2M_CLIENT_ID", "LOGTO_M2M_CLIENT_SECRET", "LOGTO_API_RESOURCE", "API_URL"]) {
  if (workerBlock.includes(forbidden)) fail(`worker compose block must not contain ${forbidden}`);
}

if (process.exitCode) process.exit(process.exitCode);
console.log("Civitas env config validated");
