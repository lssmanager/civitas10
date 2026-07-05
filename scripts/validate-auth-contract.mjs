import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  CIVITAS_API_URL,
  CIVITAS_LOGTO_API_RESOURCE,
  CIVITAS_LOGTO_ISSUER,
} = require("../core/auth/civitas-auth.constants.cjs");

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

const frontendEnv = parseEnv("frontend/.env.example");
const backendEnv = parseEnv("backend/.env.example");
const rootEnv = parseEnv(".env.example");

for (const [file, env] of [["frontend/.env.example", frontendEnv], [".env.example", rootEnv]]) {
  if (env.VITE_LOGTO_API_RESOURCE !== CIVITAS_LOGTO_API_RESOURCE) fail(`${file} VITE_LOGTO_API_RESOURCE drifted from canonical constant`);
  if (/^https?:\/\//i.test(env.VITE_LOGTO_API_RESOURCE || "")) fail(`${file} VITE_LOGTO_API_RESOURCE must not be an HTTP URL`);
  if (env.VITE_API_URL !== CIVITAS_API_URL) fail(`${file} VITE_API_URL drifted from canonical constant`);
  if (env.VITE_LOGTO_ENDPOINT !== CIVITAS_LOGTO_ISSUER) fail(`${file} VITE_LOGTO_ENDPOINT drifted from canonical constant`);
}

for (const [file, env] of [["backend/.env.example", backendEnv], [".env.example", rootEnv]]) {
  if (env.LOGTO_API_RESOURCE !== CIVITAS_LOGTO_API_RESOURCE) fail(`${file} LOGTO_API_RESOURCE drifted from canonical constant`);
  if (/^https?:\/\//i.test(env.LOGTO_API_RESOURCE || "")) fail(`${file} LOGTO_API_RESOURCE must not be an HTTP URL`);
  if (env.API_URL !== CIVITAS_API_URL) fail(`${file} API_URL drifted from canonical constant`);
}

const runtimeFiles = [
  "config/civitas.config.ts",
  "frontend/src/env.ts",
  "frontend/src/api/base.ts",
  "backend/index.js",
  "backend/middleware/auth.js",
  "backend/runtime/env.js",
  "backend/worker/index.js",
  "runtime/env.js",
];

for (const file of runtimeFiles) {
  const source = read(file);
  if (source.includes(`${CIVITAS_LOGTO_API_RESOURCE}"`) || source.includes(`${CIVITAS_LOGTO_API_RESOURCE}'`)) {
    fail(`${file} hardcodes the Logto API resource instead of importing the canonical constant`);
  }
  if (/LOGTO_API_RESOURCE\s*=\s*API_URL|API_URL\s*=\s*LOGTO_API_RESOURCE/.test(source)) {
    fail(`${file} couples API_URL and LOGTO_API_RESOURCE`);
  }
}

if (process.exitCode) process.exit(process.exitCode);
console.log("Civitas auth contract validated");
