import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const files = [
  ".env.example",
  "backend/.env.example",
  "frontend/.env.example",
  "docker-compose.yml",
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
  /API_BASE_URL/,
  /VITE_API_RESOURCE=/,
  /(?<!VITE_)LOGTO_ENDPOINT/,
  /LOGTO_CLIENT_ID/,
  /LOGTO_CLIENT_SECRET/,
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
if (!/^VITE_API_URL=https:\/\/civitas\.didaxus\.com\/api$/m.test(frontendEnv)) fail("frontend must expose only VITE_API_URL for the public API");
if (!/^VITE_LOGTO_API_RESOURCE=urn:civitas:api$/m.test(frontendEnv)) fail("frontend must request the logical urn:civitas:api Logto resource");
if (/^VITE_LOGTO_API_RESOURCE=https?:\/\//m.test(frontendEnv)) fail("VITE_LOGTO_API_RESOURCE must not be an HTTP URL");
if (/\/backend/.test(frontendEnv)) fail("frontend env must not contain Coolify /backend internal route");

const backendEnv = read("backend/.env.example");
if (!/^API_URL=https:\/\/civitas\.didaxus\.com\/api$/m.test(backendEnv)) fail("backend API_URL must be the public /api URL");
if (!/^LOGTO_API_RESOURCE=urn:civitas:api$/m.test(backendEnv)) fail("backend Logto API resource must be the logical urn:civitas:api audience");
if (/^LOGTO_API_RESOURCE=https?:\/\//m.test(backendEnv)) fail("LOGTO_API_RESOURCE must not be an HTTP URL");
if (!/^LOGTO_MANAGEMENT_API_RESOURCE=https:\/\/auth\.didaxus\.com\/$/m.test(backendEnv)) fail("Logto Management API resource must stay separate from the Civitas API resource");

if (process.exitCode) process.exit(process.exitCode);
console.log("Civitas env config validated");
