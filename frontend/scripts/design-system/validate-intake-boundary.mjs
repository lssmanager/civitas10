#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, relative } from "node:path";

const frontendRoot = new URL("../../", import.meta.url).pathname;
const repoRoot = new URL("../../../", import.meta.url).pathname;
const failures = [];
const fail = (message) => failures.push(message);
const runGit = (args) => execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim();

const ignored = runGit(["check-ignore", "frontend/.design-intake/probe.local.md"]);
if (!ignored.includes("frontend/.design-intake")) fail("frontend/.design-intake/ must be ignored by Git");

const tracked = runGit(["ls-files", "frontend/.design-intake"]);
if (tracked) fail(`tracked intake files are forbidden: ${tracked}`);

const forbiddenRoots = [
  "frontend/src/design-system/components",
  "frontend/src/design-system/tokens.css",
  "packages/design-system",
  "tailwind-plus-components",
  "tailwind-plus-snippets",
];
for (const root of forbiddenRoots) if (existsSync(join(repoRoot, root))) fail(`forbidden parallel design-system root exists: ${root}`);

const packageJson = JSON.parse(readFileSync(join(frontendRoot, "package.json"), "utf8"));
const deps = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
for (const dep of Object.keys(deps)) {
  if (/(@tailwindplus|@tailwindui|catalyst)/i.test(dep)) fail(`forbidden Tailwind Plus/Catalyst dependency declared: ${dep}`);
}

const sourceFiles = runGit(["ls-files", "frontend/src", "frontend/scripts", "docs"])
  .split("\n")
  .filter((file) => /\.(ts|tsx|js|jsx|mjs|css|md|json)$/.test(file));
const importPattern = /(?:from\s+['"][^'"]*\.design-intake|import\s*\([^)]*\.design-intake|require\s*\([^)]*\.design-intake)/;
const intakeReferencePattern = /\.design-intake/;
const licensedSourcePattern = /(tailwind\s*plus\s*(?:source|snippet|component)|@tailwindplus\/elements|@tailwindui|catalyst\s+ui\s+kit)/i;
const documentationFiles = new Set([
  "docs/architecture/CIVITAS_DESIGN_SYSTEM_FOUNDATION.md",
]);
const boundaryToolFiles = new Set([
  "frontend/scripts/validate-tailwind-semantic-contract.mjs",
  "frontend/scripts/design-system/map-tailwind-plus-palette.mjs",
  "frontend/scripts/design-system/validate-intake-boundary.mjs",
  "frontend/src/design-system-pipeline.contract.test.mjs",
]);
for (const file of sourceFiles) {
  const text = readFileSync(join(repoRoot, file), "utf8");
  const rel = relative(repoRoot, join(repoRoot, file));
  const isDocumentedBoundary = documentationFiles.has(rel) || boundaryToolFiles.has(rel);
  if (importPattern.test(text) && !isDocumentedBoundary) fail(`forbidden .design-intake import in tracked file: ${rel}`);
  if (intakeReferencePattern.test(text) && rel.startsWith("frontend/src/") && !isDocumentedBoundary) fail(`forbidden .design-intake reference in product source: ${rel}`);
  if (licensedSourcePattern.test(text) && !rel.includes("scripts/design-system") && !rel.endsWith("CIVITAS_DESIGN_SYSTEM_FOUNDATION.md")) fail(`possible licensed Tailwind Plus source/reference committed: ${rel}`);
}

if (!existsSync(join(frontendRoot, "src/shared/ui/index.ts"))) fail("shared/ui/index.ts must remain the reusable UI entrypoint");

if (failures.length) {
  console.error("[design-intake-boundary] Intake boundary validation failed:");
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}
console.log("[design-intake-boundary] Local intake is ignored, untracked, non-importable, and no forbidden Tailwind Plus dependencies or UI roots are present.");
