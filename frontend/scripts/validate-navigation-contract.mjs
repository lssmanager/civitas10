#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, relative } from "node:path";

const repoRoot = new URL("../../", import.meta.url).pathname;
const frontendRoot = join(repoRoot, "frontend");
const failures = [];
const fail = (message) => failures.push(message);
const runGit = (args) => execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim();

if (existsSync(join(frontendRoot, "src/platform"))) fail("frontend/src/platform/** is forbidden for #111; extend authorization/navigation instead.");

const files = runGit(["ls-files", "frontend/src"])
  .split("\n")
  .filter((file) => /\.(ts|tsx|js|jsx|mjs)$/.test(file));

const allowedContractFiles = new Set([
  "frontend/src/navigation/routes.ts",
  "frontend/src/navigation/route-catalog.ts",
  "frontend/src/navigation/route-builders.ts",
  "frontend/src/navigation/route-contracts.contract.test.mjs",
  "frontend/src/features/governance/GovernanceStudio.contract.test.mjs",
]);

for (const file of files) {
  const text = readFileSync(join(repoRoot, file), "utf8");
  const rel = relative(repoRoot, join(repoRoot, file));
  const isAllowedContract = allowedContractFiles.has(rel) || rel.endsWith(".contract.test.mjs");
  if (!isAllowedContract && /:organizationId/.test(text)) fail(`${rel}: raw :organizationId placeholder is only allowed in route contracts/builders/tests.`);
  if (/navigate\([^)]*["'`][^"'`]*:organizationId/.test(text)) fail(`${rel}: navigate() must use route builders with a concrete organizationId.`);
  if (/<Link[^>]+to=["'`][^"'`]*:organizationId/.test(text)) fail(`${rel}: <Link to> must use route builders with a concrete organizationId.`);
  if (/fetch\([^)]*["'`][^"'`]*:organizationId/.test(text)) fail(`${rel}: fetch() must use API/route builders with concrete organizationId.`);
  if (/%3AorganizationId/.test(text)) fail(`${rel}: encoded placeholder %3AorganizationId must never be generated.`);
}

const routes = readFileSync(join(frontendRoot, "src/navigation/routes.ts"), "utf8");
for (const required of ["ownerNavigationTree", "tenantNavigationTree", "Directory", "Settings", "Worker runtime", "ownerOrganizationGovernance", "ownerPlatformSettings"]) {
  if (!routes.includes(required)) fail(`navigation route contract missing ${required}`);
}
const appShell = readFileSync(join(frontendRoot, "src/layouts/AppShell.tsx"), "utf8");
if (/emptyNavItems/.test(appShell)) fail("AppShell must not use emptyNavItems fallback.");
if (!/navigation-required-but-empty/.test(appShell)) fail("AppShell must expose an explicit missing-navigation failure state.");

if (failures.length) {
  console.error("[navigation-contract] Navigation contract validation failed:");
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}
console.log("[navigation-contract] Navigation topology, route placeholders, and AppShell fallback contract are valid.");
