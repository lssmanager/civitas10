import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("../", import.meta.url);
const srcDir = join(root.pathname, "src");
const bridge = join(srcDir, "styles", "tailwind-theme.css");
const indexCss = join(srcDir, "index.css");
const distAssets = join(root.pathname, "dist", "assets");
const failures = [];
const fail = (message) => failures.push(message);
const read = (path) => readFileSync(path, "utf8");

if (!existsSync(indexCss) || !read(indexCss).includes('@import "tailwindcss";')) fail('frontend/src/index.css must import Tailwind v4 with @import "tailwindcss";');
for (const file of [indexCss, bridge]) if (existsSync(file) && /@tailwind\s+(base|components|utilities)/.test(read(file))) fail(`legacy Tailwind v3 directive found in ${relative(root.pathname, file)}`);
if (!existsSync(bridge)) fail("canonical Tailwind bridge is missing at src/styles/tailwind-theme.css");
else {
  const css = read(bridge);
  if (!/@theme\s+inline\s*\{/.test(css)) fail("tailwind-theme.css must use @theme inline");
  if (/(#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\()/i.test(css)) fail("tailwind-theme.css must not contain hardcoded color values");
  for (const decl of css.matchAll(/--[\w-*]+\s*:\s*([^;]+);/g)) {
    const value = decl[1].trim();
    if (value !== "initial" && !/^var\(--civitas-[\w-]+\)$/.test(value)) fail(`non-Civitas mapping in tailwind-theme.css: ${decl[0]}`);
  }
}

const cssFiles = [];
const sourceFiles = [];
const walk = (dir) => {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const st = statSync(path);
    if (st.isDirectory()) {
      if (["node_modules", "dist", ".git"].includes(entry)) continue;
      walk(path);
    } else if (/\.(css|ts|tsx|js|jsx)$/.test(entry)) {
      if (entry.endsWith(".css")) cssFiles.push(path); else sourceFiles.push(path);
    }
  }
};
walk(srcDir);
const themeFiles = cssFiles.filter((file) => /@theme\s+/.test(read(file)));
for (const file of themeFiles) if (file !== bridge) fail(`unexpected @theme outside approved bridge: ${relative(root.pathname, file)}`);
if (themeFiles.length !== 1) fail(`expected exactly one @theme bridge, found ${themeFiles.length}`);

if (existsSync(join(srcDir, "design-system"))) fail("frontend/src/design-system/ is forbidden");
const classTokenPattern = /(?:^|\s)(?:dark:)?(?:hover:|focus:|active:|disabled:|sm:|md:|lg:|xl:|2xl:)*-?(?:bg|text|border|ring|placeholder)-(?:indigo|blue|slate|gray|amber|white|black|red|green|yellow|emerald)(?:-[\w./]+)?(?=\s|$)/;
const arbitraryColorPattern = /\b[a-z:-]+-\[(?:#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|oklch\(|--(?!civitas-))/;
const hardcodedInlineStylePattern = /style=\{\{[^}]*\b(?:color|background(?:Color)?|borderColor|boxShadow)\s*:\s*['"](?:#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|oklch\()/s;
for (const file of sourceFiles) {
  const text = read(file);
  const rel = relative(root.pathname, file);
  if (/features\/.*\.design-intake/.test(text)) fail(`feature imports .design-intake: ${rel}`);
  for (const line of text.split(/\n/)) {
    if (classTokenPattern.test(line)) fail(`raw Tailwind palette class in ${rel}: ${line.trim()}`);
    if (arbitraryColorPattern.test(line)) fail(`arbitrary non-canonical color utility in ${rel}: ${line.trim()}`);
  }
  if (hardcodedInlineStylePattern.test(text)) fail(`hardcoded inline color style in ${rel}`);
}

if (!existsSync(distAssets)) fail("dist/assets is missing; run npm run build before validate:tailwind-contract");
else {
  const builtCss = readdirSync(distAssets).filter((f) => f.endsWith(".css")).map((f) => read(join(distAssets, f))).join("\n");
  if (!builtCss) fail("no built CSS asset found");
  if (/@tailwind\s+/.test(builtCss)) fail("built CSS contains unprocessed @tailwind directives");
  for (const sentinel of [".flex-wrap", ".text-sm", ".gap-2", ".mt-3", ".bg-surface", ".text-muted", ".border-border"]) {
    if (!builtCss.includes(sentinel)) fail(`compiled CSS sentinel missing: ${sentinel}`);
  }
}

if (failures.length) {
  console.error("[tailwind-contract] Semantic Tailwind contract failed:");
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}
console.log("[tailwind-contract] Semantic Tailwind bridge and compiled sentinels are valid.");
