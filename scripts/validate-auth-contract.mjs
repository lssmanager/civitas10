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

const contractSource = read("core/auth/civitas-auth.contract.ts");
const compiledContract = JSON.parse(read("dist/auth.contract.json"));
if (JSON.stringify(compiledContract) !== JSON.stringify(CivitasAuthContract)) fail("compiled auth contract loader mismatch");
if (CivitasAuthContract.logto.apiResource !== "urn:civitas:api") fail("canonical Logto API resource drifted");
if (/^https?:\/\//i.test(CivitasAuthContract.logto.apiResource)) fail("canonical Logto API resource must not be an HTTP URL");

const frontendEnv = parseEnv("frontend/.env.example");
if (frontendEnv.VITE_API_URL !== CivitasAuthContract.api.publicUrl) fail("frontend VITE_API_URL drifted from contract");
if (frontendEnv.VITE_LOGTO_ENDPOINT !== CivitasAuthContract.logto.issuer) fail("frontend VITE_LOGTO_ENDPOINT drifted from contract");
if (frontendEnv.VITE_LOGTO_API_RESOURCE) fail("frontend must not define VITE_LOGTO_API_RESOURCE");

const backendEnv = parseEnv("backend/.env.example");
if (backendEnv.API_URL !== CivitasAuthContract.api.publicUrl) fail("backend API_URL drifted from contract");
if (backendEnv.LOGTO_API_RESOURCE !== CivitasAuthContract.logto.apiResource) fail("backend LOGTO_API_RESOURCE drifted from contract");
if (/^https?:\/\//i.test(backendEnv.LOGTO_API_RESOURCE || "")) fail("backend LOGTO_API_RESOURCE must not be an HTTP URL");

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
  if (source.includes("import.meta.env.VITE_LOGTO_API_RESOURCE")) fail(`${file} uses VITE_LOGTO_API_RESOURCE`);
  if (source.includes("process.env.LOGTO_API_RESOURCE")) fail(`${file} resolves Logto audience from env instead of contract`);
  if (source.includes(`${CivitasAuthContract.logto.apiResource}"`) || source.includes(`${CivitasAuthContract.logto.apiResource}'`)) {
    fail(`${file} hardcodes the Logto API resource instead of using the contract`);
  }
  if (/LOGTO_API_RESOURCE\s*=\s*API_URL|API_URL\s*=\s*LOGTO_API_RESOURCE|apiResource\s*[:=]\s*.*API_URL/.test(source)) {
    fail(`${file} couples API_URL and Logto audience`);
  }
}

const literalOccurrences = (contractSource.match(/urn:civitas:api/g) || []).length;
if (literalOccurrences !== 1) fail("core auth contract must define the Logto resource exactly once");

if (process.exitCode) process.exit(process.exitCode);
console.log("Civitas auth contract validated");
