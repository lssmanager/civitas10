#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptDir, "../..");
const monorepoRoot = resolve(frontendRoot, "..");
const repoRoot = existsSync(join(monorepoRoot, "frontend")) ? monorepoRoot : frontendRoot;
const frontendPrefix = repoRoot === frontendRoot ? "" : "frontend/";
const toRepoPath = (path) => `${frontendPrefix}${path}`;
const fromRepoPath = (path) => frontendPrefix && path.startsWith(frontendPrefix) ? path.slice(frontendPrefix.length) : path;
const failures = [];
const fail = (message) => failures.push(message);

const gitAvailable = spawnSync("git", ["--version"], { encoding: "utf8" }).status === 0;
const hasGitWorktree = gitAvailable && spawnSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: repoRoot, encoding: "utf8" }).status === 0;
const runGit = (args) => execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim();

const readGitignore = () => {
  const candidates = [join(frontendRoot, ".gitignore"), join(repoRoot, ".gitignore")];
  return candidates.filter(existsSync).map((file) => readFileSync(file, "utf8")).join("\n");
};

if (hasGitWorktree) {
  const ignored = runGit(["check-ignore", toRepoPath(".design-intake/probe.local.md")]);
  if (!ignored.includes(".design-intake")) fail("frontend/.design-intake/ must be ignored by Git");
  const tracked = runGit(["ls-files", toRepoPath(".design-intake")]);
  if (tracked) fail(`tracked intake files are forbidden: ${tracked}`);
} else {
  const gitignore = readGitignore();
  if (gitignore && !/(^|\n)\.design-intake\/($|\n)|(^|\n)frontend\/\.design-intake\/($|\n)/.test(gitignore)) fail("frontend/.design-intake/ must be listed in .gitignore");
  if (existsSync(join(frontendRoot, ".design-intake"))) fail("frontend/.design-intake/ must remain local and absent from production build context when Git metadata is unavailable");
}

const forbiddenRoots = [
  "src/design-system/components",
  "src/design-system/tokens.css",
  "../packages/design-system",
  "../tailwind-plus-components",
  "../tailwind-plus-snippets",
];
for (const root of forbiddenRoots) if (existsSync(resolve(frontendRoot, root))) fail(`forbidden parallel design-system root exists: ${root}`);

const packageJson = JSON.parse(readFileSync(join(frontendRoot, "package.json"), "utf8"));
const deps = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
for (const dep of Object.keys(deps)) {
  if (/(@tailwindplus|@tailwindui|catalyst)/i.test(dep)) fail(`forbidden Tailwind Plus/Catalyst dependency declared: ${dep}`);
}

const walk = (dir, prefix = "") => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", ".design-intake"].includes(entry.name)) return [];
    const absolute = join(dir, entry.name);
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? walk(absolute, rel) : [rel];
  });
};

const sourceFiles = hasGitWorktree
  ? runGit(["ls-files", toRepoPath("src"), toRepoPath("scripts"), "docs"])
    .split("\n")
    .filter(Boolean)
    .map(fromRepoPath)
    .filter((file) => /^(src|scripts)\//.test(file) || /^docs\//.test(file))
  : [...walk(join(frontendRoot, "src"), "src"), ...walk(join(frontendRoot, "scripts"), "scripts")];
const importPattern = /(?:from\s+['"][^'"]*\.design-intake|import\s*\([^)]*\.design-intake|require\s*\([^)]*\.design-intake)/;
const intakeReferencePattern = /\.design-intake/;
const licensedSourcePattern = /(tailwind\s*plus\s*(?:source|snippet|component)|@tailwindplus\/elements|@tailwindui|catalyst\s+ui\s+kit)/i;
const documentationFiles = new Set([
  "docs/architecture/CIVITAS_DESIGN_SYSTEM_FOUNDATION.md",
]);
const boundaryToolFiles = new Set([
  "scripts/validate-tailwind-semantic-contract.mjs",
  "scripts/design-system/map-tailwind-plus-palette.mjs",
  "scripts/design-system/validate-intake-boundary.mjs",
  "src/design-system-pipeline.contract.test.mjs",
]);
for (const file of sourceFiles.filter((file) => /\.(ts|tsx|js|jsx|mjs|css|md|json)$/.test(file))) {
  const absolute = file.startsWith("docs/") ? join(repoRoot, file) : join(frontendRoot, file);
  if (!existsSync(absolute)) continue;
  const text = readFileSync(absolute, "utf8");
  const rel = file.startsWith("docs/") ? file : relative(frontendRoot, absolute);
  const isDocumentedBoundary = documentationFiles.has(rel) || boundaryToolFiles.has(rel);
  if (importPattern.test(text) && !isDocumentedBoundary) fail(`forbidden .design-intake import in tracked file: ${rel}`);
  if (intakeReferencePattern.test(text) && rel.startsWith("src/") && !isDocumentedBoundary) fail(`forbidden .design-intake reference in product source: ${rel}`);
  if (licensedSourcePattern.test(text) && !rel.includes("scripts/design-system") && !rel.endsWith("CIVITAS_DESIGN_SYSTEM_FOUNDATION.md")) fail(`possible licensed Tailwind Plus source/reference committed: ${rel}`);
}

if (!existsSync(join(frontendRoot, "src/shared/ui/index.ts"))) fail("shared/ui/index.ts must remain the reusable UI entrypoint");

if (failures.length) {
  console.error("[design-intake-boundary] Intake boundary validation failed:");
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}
const mode = hasGitWorktree ? "git" : "filesystem";
console.log(`[design-intake-boundary] Local intake boundary is valid (${mode} mode), non-importable, and no forbidden Tailwind Plus dependencies or UI roots are present.`);
