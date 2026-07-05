import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadCivitasAuthContract } = require("../core/auth/contract-loader.cjs");
const CivitasAuthContract = loadCivitasAuthContract();

const root = new URL("..", import.meta.url).pathname;
const read = (file) => readFileSync(join(root, file), "utf8");
const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};

const contractSource = read("core/auth/civitas-auth.contract.ts");
const compiledContract = JSON.parse(read("dist/auth.contract.json"));

if (JSON.stringify(compiledContract) !== JSON.stringify(CivitasAuthContract)) fail("compiled auth contract loader mismatch");
if (CivitasAuthContract.logto.apiResource !== "urn:civitas:api") fail("canonical Logto API resource drifted");
if (/^https?:\/\//i.test(CivitasAuthContract.logto.apiResource)) fail("canonical Logto API resource must not be an HTTP URL");
if (CivitasAuthContract.api.publicUrl !== "https://civitas.didaxus.com/api") fail("canonical public API URL drifted");
if (CivitasAuthContract.logto.issuer !== "https://auth.didaxus.com") fail("canonical Logto issuer drifted");
if (CivitasAuthContract.logto.managementApi !== "https://auth.didaxus.com") fail("canonical Logto Management API resource drifted");

const runtimeFiles = [
  "config/civitas.config.ts",
  "frontend/src/env.ts",
  "frontend/src/api/base.ts",
  "backend/index.js",
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
  if (source.includes("process.env.LOGTO_API_RESOURCE") || source.includes("import.meta.env.VITE_LOGTO_API_RESOURCE")) {
    fail(`${file} uses env-based Logto API resource resolution`);
  }
  if (source.includes(`${CivitasAuthContract.logto.apiResource}"`) || source.includes(`${CivitasAuthContract.logto.apiResource}'`)) {
    fail(`${file} hardcodes the Logto API resource instead of using the compiled contract`);
  }
  if (/LOGTO_API_RESOURCE\s*=\s*API_URL|API_URL\s*=\s*LOGTO_API_RESOURCE|apiResource\s*[:=]\s*.*API_URL/.test(source)) {
    fail(`${file} couples API_URL and Logto audience`);
  }
}

const envFiles = [".env.example", "backend/.env.example", "frontend/.env.example", "docker-compose.yml", "frontend/Dockerfile"];
for (const file of envFiles) {
  const source = read(file);
  if (/^\s*(VITE_)?LOGTO_API_RESOURCE\s*[=:]/m.test(source)) fail(`${file} must not define Logto API resource env vars`);
  if (/^\s*LOGTO_MANAGEMENT_API_RESOURCE\s*[=:]/m.test(source)) fail(`${file} must not define Logto Management resource env vars`);
  if (/^\s*VITE_LOGTO_ENDPOINT\s*[=:]/m.test(source)) fail(`${file} must not define Logto issuer env vars`);
}

const literalOccurrences = (contractSource.match(/urn:civitas:api/g) || []).length;
if (literalOccurrences !== 1) fail("core auth contract must define the Logto resource exactly once");

if (process.exitCode) process.exit(process.exitCode);
console.log("Civitas auth contract validated");
