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
const importPattern = /(?:from\s+['"][^'"]*\.design-intake|import\s*\([^)]*\.design-intake|require\s*\([^)]*\.design-intake|\.design-intake)/;
const licensedSourcePattern = /(tailwind\s*plus\s*(?:source|snippet|component)|@tailwindplus\/elements|@tailwindui|catalyst\s+ui\s+kit)/i;
for (const file of sourceFiles) {
  const text = readFileSync(join(repoRoot, file), "utf8");
  const rel = relative(repoRoot, join(repoRoot, file));
  if (importPattern.test(text) && !rel.endsWith("validate-intake-boundary.mjs") && !rel.endsWith("validate-tailwind-semantic-contract.mjs") && !rel.endsWith("design-system-pipeline.contract.test.mjs") && !rel.endsWith("CIVITAS_DESIGN_SYSTEM_FOUNDATION.md")) fail(`forbidden .design-intake reference in tracked file: ${rel}`);
  if (licensedSourcePattern.test(text) && !rel.includes("scripts/design-system") && !rel.endsWith("CIVITAS_DESIGN_SYSTEM_FOUNDATION.md")) fail(`possible licensed Tailwind Plus source/reference committed: ${rel}`);
}

if (!existsSync(join(frontendRoot, "src/shared/ui/index.ts"))) fail("shared/ui/index.ts must remain the reusable UI entrypoint");

if (failures.length) {
  console.error("[design-intake-boundary] Intake boundary validation failed:");
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}
console.log("[design-intake-boundary] Local intake is ignored, untracked, non-importable, and no forbidden Tailwind Plus dependencies or UI roots are present.");
