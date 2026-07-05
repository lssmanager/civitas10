import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { validateDeploymentConfig } = require("../core/deployment/deployment-kernel.cjs");

const root = new URL("..", import.meta.url).pathname;
const read = (file) => readFileSync(join(root, file), "utf8");
const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};

const parseEnv = (file) => Object.fromEntries(
  read(file)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

const contractSource = read("core/shared/civitas-shared.contract.cjs");
const compiledContract = JSON.parse(read("dist/auth.contract.json"));
const sharedContract = JSON.parse(read("dist/shared.contract.json"));
if (compiledContract.logto.apiResource !== sharedContract.logto.apiResource) fail("canonical Logto API resource drifted");
if (/^https?:\/\//i.test(compiledContract.logto.apiResource)) fail("canonical Logto API resource must not be an HTTP URL");

const frontendEnv = parseEnv("frontend/.env.example");
try { validateDeploymentConfig({ service: "frontend", env: frontendEnv }); } catch (error) { fail(error.message); }
const removedFrontendAudience = ["VITE", "LOGTO", "API", "RESOURCE"].join("_");
if (frontendEnv[removedFrontendAudience]) fail("frontend must not define a Logto resource env variable");

const backendEnv = parseEnv("backend/.env.example");
try { validateDeploymentConfig({ service: "backend", env: backendEnv }); } catch (error) { fail(error.message); }

const runtimeFiles = [
  "config/civitas.config.ts",
  "frontend/src/env.ts",
  "frontend/src/api/base.ts",
  "backend/middleware/auth.js",
  "backend/runtime/env.js",
  "backend/worker/index.js",
  "backend/services/logtoManagement.js",
  "backend/lib/utils.js",
  "backend/connectors/identity/logto/config.js",
  "runtime/env.js",
];

for (const file of runtimeFiles) {
  const source = read(file);
  if (source.includes(`import.meta.env.${removedFrontendAudience}`)) fail(`${file} uses a removed frontend Logto resource env variable`);
  if (source.includes("process.env.LOGTO_API_RESOURCE")) fail(`${file} resolves Logto audience from env instead of contract`);
  if (source.includes(`${compiledContract.logto.apiResource}"`) || source.includes(`${compiledContract.logto.apiResource}'`)) {
    fail(`${file} hardcodes the Logto API resource instead of using the contract`);
  }
  if (/LOGTO_API_RESOURCE\s*=\s*API_URL|API_URL\s*=\s*LOGTO_API_RESOURCE|apiResource\s*[:=]\s*.*API_URL/.test(source)) {
    fail(`${file} couples API_URL and Logto audience`);
  }
}

const literalOccurrences = (contractSource.match(/urn:civitas:api/g) || []).length;
if (literalOccurrences !== 1) fail("core shared contract must define the Logto resource exactly once");

if (process.exitCode) process.exit(process.exitCode);
console.log("Civitas auth contract validated");
