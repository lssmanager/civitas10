import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const distDir = new URL("../dist/", import.meta.url);
const indexPath = new URL("../dist/index.html", import.meta.url);

const fail = (message) => {
  console.error(`[civitas-visual] ${message}`);
  process.exit(1);
};

if (!existsSync(indexPath)) fail("dist/index.html is missing; run vite build first.");

const html = readFileSync(indexPath, "utf8");
if (!/<link[^>]+rel="stylesheet"[^>]+href="\/assets\//.test(html)) fail("built HTML does not reference a CSS asset.");

const assetsDir = join(distDir.pathname, "assets");
const jsFiles = existsSync(assetsDir) ? readdirSync(assetsDir).filter((file) => file.endsWith(".js")) : [];
const cssFiles = existsSync(assetsDir) ? readdirSync(assetsDir).filter((file) => file.endsWith(".css")) : [];
if (cssFiles.length === 0) fail("no CSS assets were emitted by the frontend build.");

const css = cssFiles.map((file) => readFileSync(join(assetsDir, file), "utf8")).join("\n");
const js = jsFiles.map((file) => readFileSync(join(assetsDir, file), "utf8")).join("\n");

for (const selector of [".civitas-shell", ".civitas-topbar", ".civitas-primary-nav", ".civitas-card", ".civitas-field"]) {
  if (!css.includes(selector)) fail(`critical Civitas selector ${selector} is missing from built CSS.`);
}

if (!/\.civitas-card[^}]*border-radius/.test(css) || !/\.civitas-topbar[^}]*border-bottom/.test(css)) fail("critical Civitas layout CSS lacks expected card radius or topbar border declarations.");

for (const forbidden of ["DocuMind", "Intelligent Document Management Solution", "AI-Powered Experience for Your Team"]) {
  if (html.includes(forbidden) || js.includes(forbidden) || css.includes(forbidden)) fail(`demo residue found in build: ${forbidden}`);
}

if (!js.includes('data-civitas-shell') || !js.includes('Civitas public portal')) fail("public root is not wired to the canonical Civitas shell.");

console.log("[civitas-visual] Built public and authenticated Civitas shell styles are present and demo residue is absent.");
