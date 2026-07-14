#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const argFileIndex = process.argv.indexOf("--file");

const provenanceCandidates = () => {
  if (argFileIndex !== -1) return [resolve(process.cwd(), process.argv[argFileIndex + 1] ?? "")];
  if (process.env.CIVITAS_PROVENANCE_FILE) return [resolve(process.cwd(), process.env.CIVITAS_PROVENANCE_FILE)];

  return [
    // Repository checkout: command is usually run from frontend/.
    resolve(process.cwd(), "../docs/design-system/provenance.json"),
    // Repository root: supports direct invocation from the root.
    resolve(process.cwd(), "docs/design-system/provenance.json"),
    // Docker frontend image: frontend is copied to /app and docs/design-system to /docs/design-system.
    resolve("/docs/design-system/provenance.json"),
    // Script-relative fallback for unusual local invocations.
    resolve(scriptDir, "../../../docs/design-system/provenance.json"),
  ];
};

const candidates = provenanceCandidates();
const provenancePath = candidates.find((candidate) => existsSync(candidate));
const failures = [];
const fail = (message) => failures.push(message);
const shaPattern = /^[0-9a-f]{40}$/i;
const secretKeyPattern = /(licenseKey|license_key|invoice|receipt|privateUrl|private_url|sourceCode|source_code|email)/i;
const emailValuePattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

if (!provenancePath) {
  console.error("[design-provenance] Provenance validation failed:");
  console.error("- docs/design-system/provenance.json was not found.");
  console.error("- The provenance metadata is required by the #114 design-intake contract and must be available during build.");
  console.error("- Checked paths:");
  for (const candidate of candidates) console.error(`  - ${candidate}`);
  console.error("- In Docker builds, copy docs/design-system/ into /docs/design-system/ before running npm run build.");
  process.exit(1);
}

let data;
try {
  data = JSON.parse(readFileSync(provenancePath, "utf8"));
} catch (error) {
  console.error("[design-provenance] Provenance validation failed:");
  console.error(`- Unable to read or parse ${provenancePath}: ${error.message}`);
  process.exit(1);
}
if (data.version !== 1) fail("provenance.version must be 1");
if (!Array.isArray(data.entries)) fail("provenance.entries must be an array");

const inspectSecrets = (value, path = "provenance") => {
  if (Array.isArray(value)) return value.forEach((item, index) => inspectSecrets(item, `${path}[${index}]`));
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (secretKeyPattern.test(key)) fail(`forbidden secret/source metadata key at ${path}.${key}`);
      inspectSecrets(child, `${path}.${key}`);
    }
    return;
  }
  if (typeof value === "string" && emailValuePattern.test(value)) fail(`email-like value is forbidden at ${path}`);
};
inspectSecrets(data);

if (Array.isArray(data.entries)) {
  for (const [index, entry] of data.entries.entries()) {
    const prefix = `entries[${index}]`;
    for (const field of ["component", "sourceFamily", "sourceVersion", "licenseType", "verifiedBy", "adaptedAt", "mapperVersion", "promotionCommit", "redistributionBoundary"]) {
      if (typeof entry[field] !== "string" || entry[field].length === 0) fail(`${prefix}.${field} must be a non-empty string`);
    }
    if (entry.licenseVerified !== true) fail(`${prefix}.licenseVerified must be true for real promoted entries`);
    if (entry.sourceCommitted !== false) fail(`${prefix}.sourceCommitted must be false`);
    if (entry.redistributionBoundary !== "civitas10-end-product") fail(`${prefix}.redistributionBoundary must be civitas10-end-product`);
    if (!shaPattern.test(entry.promotionCommit || "")) fail(`${prefix}.promotionCommit must be a full 40-character git SHA`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.adaptedAt || "")) fail(`${prefix}.adaptedAt must use YYYY-MM-DD`);
    if (!entry.review || entry.review.semantic !== true || entry.review.accessibility !== true || entry.review.responsive !== true) fail(`${prefix}.review semantic/accessibility/responsive must all be true`);
  }
}

if (failures.length) {
  console.error("[design-provenance] Provenance validation failed:");
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}
console.log(`[design-provenance] Provenance metadata is valid and contains no licensed source or secrets (${provenancePath}).`);
