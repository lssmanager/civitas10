#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const cwd = process.cwd();

const frontendRootCandidates = [
  cwd,
  join(cwd, "frontend"),
  resolve(scriptPath, "../../"),
  resolve(scriptPath, "../../../frontend"),
];
const frontendRoot = frontendRootCandidates.find((candidate) => existsSync(join(candidate, "src")) && existsSync(join(candidate, "package.json")));

const failures = [];
const fail = (message) => failures.push(message);

if (!frontendRoot) {
  console.error("[navigation-contract] Navigation contract validation failed:");
  console.error("- Unable to locate the frontend root. Checked:");
  for (const candidate of frontendRootCandidates) console.error(`  - ${candidate}`);
  process.exit(1);
}

const sourceRoot = join(frontendRoot, "src");

const isGitRepository = () => {
  try {
    execFileSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: frontendRoot, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

const sourceFilePattern = /\.(ts|tsx|js|jsx|mjs)$/;
const excludedDirs = new Set(["node_modules", "dist", "coverage", ".design-intake", "fixtures", "__fixtures__"]);

const listGitTrackedSourceFiles = () => execFileSync("git", ["ls-files", "src"], { cwd: frontendRoot, encoding: "utf8" })
  .trim()
  .split("\n")
  .filter(Boolean)
  .filter((file) => sourceFilePattern.test(file))
  .filter((file) => !file.split("/").some((part) => excludedDirs.has(part)))
  .map((file) => join(frontendRoot, file));

const listSourceFilesFromFilesystem = (dir = sourceRoot) => {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    if (excludedDirs.has(entry)) continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) files.push(...listSourceFilesFromFilesystem(fullPath));
    else if (stat.isFile() && sourceFilePattern.test(fullPath)) files.push(fullPath);
  }
  return files;
};

if (existsSync(join(sourceRoot, "platform"))) fail("frontend/src/platform/** is forbidden for #111; extend authorization/navigation instead.");

const gitMode = isGitRepository();
const files = gitMode ? listGitTrackedSourceFiles() : listSourceFilesFromFilesystem();

const allowedContractFiles = new Set([
  "src/navigation/routes.ts",
  "src/navigation/route-catalog.ts",
  "src/navigation/route-builders.ts",
  "src/navigation/route-contracts.contract.test.mjs",
  "src/features/governance/GovernanceStudio.contract.test.mjs",
]);

const displayPath = (file) => {
  const relToFrontend = relative(frontendRoot, file).replaceAll("\\", "/");
  return basename(frontendRoot) === "frontend" ? `frontend/${relToFrontend}` : relToFrontend;
};

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const relToFrontend = relative(frontendRoot, file).replaceAll("\\", "/");
  const rel = displayPath(file);
  const isAllowedContract = allowedContractFiles.has(relToFrontend) || relToFrontend.endsWith(".contract.test.mjs");
  if (!isAllowedContract && /:organizationId/.test(text)) fail(`${rel}: raw :organizationId placeholder is only allowed in route contracts/builders/tests.`);
  if (/navigate\([^)]*["'`][^"'`]*:organizationId/.test(text)) fail(`${rel}: navigate() must use route builders with a concrete organizationId.`);
  if (/<Link[^>]+to=["'`][^"'`]*:organizationId/.test(text)) fail(`${rel}: <Link to> must use route builders with a concrete organizationId.`);
  if (/fetch\([^)]*["'`][^"'`]*:organizationId/.test(text)) fail(`${rel}: fetch() must use API/route builders with concrete organizationId.`);
  if (/%3AorganizationId/.test(text) && !isAllowedContract) fail(`${rel}: encoded placeholder %3AorganizationId must never be generated.`);
}

const routesPath = join(sourceRoot, "navigation/routes.ts");
const appShellPath = join(sourceRoot, "layouts/AppShell.tsx");
const routes = readFileSync(routesPath, "utf8");
for (const required of ["ownerNavigationTree", "tenantNavigationTree", "Directory", "Settings", "Worker runtime", "ownerOrganizationGovernance", "ownerPlatformSettings"]) {
  if (!routes.includes(required)) fail(`navigation route contract missing ${required}`);
}
const appShell = readFileSync(appShellPath, "utf8");
if (/emptyNavItems/.test(appShell)) fail("AppShell must not use emptyNavItems fallback.");
if (!/navigation-required-but-empty/.test(appShell)) fail("AppShell must expose an explicit missing-navigation failure state.");

if (failures.length) {
  console.error(`[navigation-contract] Navigation contract validation failed (${gitMode ? "git" : "filesystem"} mode):`);
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}
console.log(`[navigation-contract] Navigation topology, route placeholders, and AppShell fallback contract are valid (${gitMode ? "git" : "filesystem"} mode).`);
