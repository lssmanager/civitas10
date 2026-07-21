import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const sharedUi = join(root, "src", "shared", "ui");
const forbiddenRoots = [join(root, "src", "design-system"), join(root, "src", "features", "design-system")];
const failures = [];
const fail = (message) => failures.push(message);

for (const forbiddenRoot of forbiddenRoots) if (existsSync(forbiddenRoot)) fail(`forbidden second UI-kit root exists: ${relative(root, forbiddenRoot)}`);

const files = [];
const walk = (dir) => {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    else if (/\.(ts|tsx|css)$/.test(entry)) files.push(path);
  }
};
walk(sharedUi);

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const rel = relative(root, file);
  if (/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(|color-mix\(|linear-gradient\(/i.test(text)) fail(`raw color/gradient in shared UI: ${rel}`);
  if (/grid-cols-\[|shadow-\[|w-\[|h-\[|z-\[|rounded-\[/.test(text)) fail(`arbitrary governed utility in shared UI: ${rel}`);
  if (/fetch\(|useLogto|role ===|roles\.includes/.test(text)) fail(`shared UI/pattern contains endpoint or authorization logic: ${rel}`);
}

const index = readFileSync(join(sharedUi, "index.ts"), "utf8");
for (const symbol of ["EntityWorkspace", "SettingsWorkbench", "MasterDetail", "GroupedToggleList", "HierarchyWorkbench", "FilterToolbar", "FormDrawer", "ResponsiveDataView"]) {
  if (!index.includes(symbol)) fail(`pattern is not exported from shared/ui/index.ts: ${symbol}`);
}

if (failures.length) {
  console.error("[governance-visual-contract] failed:");
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}
console.log("[governance-visual-contract] shared UI primitives and patterns use the canonical visual contract.");
