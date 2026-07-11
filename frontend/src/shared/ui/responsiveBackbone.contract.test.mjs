import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tokensCss = readFileSync(new URL("../../styles/tokens.css", import.meta.url), "utf8");
const primitivesCss = readFileSync(new URL("../../styles/primitives.css", import.meta.url), "utf8");
const layoutCss = readFileSync(new URL("../../styles/layout.css", import.meta.url), "utf8");
const hookSource = readFileSync(new URL("../hooks/useBreakpoint.ts", import.meta.url), "utf8");
const barrel = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
const sectionCard = readFileSync(new URL("./SectionCard.tsx", import.meta.url), "utf8");
const dataTable = readFileSync(new URL("./DataTable.tsx", import.meta.url), "utf8");
const appShell = readFileSync(new URL("../../layouts/AppShell.tsx", import.meta.url), "utf8");
const navCollapse = readFileSync(new URL("./NavCollapse.tsx", import.meta.url), "utf8");
const stylesIndex = readFileSync(new URL("../../styles/index.css", import.meta.url), "utf8");

test("responsive breakpoints are canonical and centralized", () => {
  for (const value of ["480px", "768px", "1024px", "1280px"]) {
    assert.match(tokensCss, new RegExp(value));
  }
  for (const css of [primitivesCss, layoutCss]) {
    const mediaValues = [...css.matchAll(/@media \((?:min|max)-width: ([^)]+)\)/g)].map((match) => match[1]);
    assert.deepEqual(mediaValues.filter((value) => !["480px", "768px", "1024px", "1280px"].includes(value)), []);
  }
});

test("responsive hook is the only viewport JS contract", () => {
  assert.match(hookSource, /BREAKPOINTS = \{ sm: 480, md: 768, lg: 1024, xl: 1280 \}/);
  assert.match(hookSource, /window\.matchMedia\(query\)/);
  assert.doesNotMatch(`${appShell}\n${sectionCard}\n${dataTable}`, /innerWidth/);
});

test("base primitives inherit responsive utilities", () => {
  assert.match(primitivesCss, /\.civitas-scroll-x\s*{[^}]*overflow-x: auto/s);
  assert.match(primitivesCss, /\.civitas-nowrap-children > \*\s*{\s*flex: 0 0 auto;/s);
  assert.match(primitivesCss, /\.civitas-visually-hidden\s*{[^}]*position: absolute;[^}]*width: 1px;[^}]*height: 1px;[^}]*overflow: hidden;[^}]*clip: rect\(0, 0, 0, 0\);/s);
  assert.match(primitivesCss, /\.civitas-stack-md\s*{\s*grid-template-columns: 1fr !important;/s);
  assert.match(primitivesCss, /\.civitas-kpi-grid\s*{[^}]*repeat\(auto-fit, minmax\(min\(100%, 10rem\), 1fr\)\)/s);
  assert.match(sectionCard, /civitas-pad-tight-md/);
  assert.match(dataTable, /civitas-table-wrap civitas-scroll-x/);
});

test("mobile topbar icon actions keep accessible labels while hiding visual text", () => {
  assert.match(appShell, /className="civitas-secondary-button civitas-icon-button civitas-mobile-menu-button"/);
  assert.match(appShell, /aria-label="Abrir menú"/);
  assert.match(appShell, /<span className="civitas-icon-button-label">Menu<\/span>/);
  assert.match(appShell, /className="civitas-secondary-button civitas-icon-button"/);
  assert.match(appShell, /aria-label="Cerrar sesión"/);
  assert.match(appShell, /<span className="civitas-icon-button-label">Sign out<\/span>/);
  assert.match(primitivesCss, /@media \(max-width: 480px\) \{[\s\S]*?\.civitas-icon-button-label\s*{[^}]*position: absolute;[^}]*width: 1px;[^}]*height: 1px;[^}]*overflow: hidden;[^}]*clip: rect\(0, 0, 0, 0\);/s);
});

test("navigation is provided by the shared NavCollapse primitive", () => {
  assert.match(barrel, /NavCollapse/);
  assert.match(appShell, /<NavCollapse/);
  assert.match(tokensCss, /--civitas-nav-item-padding-x: var\(--civitas-space-3\);/);
  assert.match(layoutCss, /\.civitas-nav-link\s*{[^}]*padding: var\(--civitas-space-2\) var\(--civitas-nav-item-padding-x\);/s);
  assert.doesNotMatch(appShell, /<nav className="civitas-primary-nav"/);
});

test("owner sidebar navigation is a persisted multi-expand tree", () => {
  assert.match(navCollapse, /children\?: NavCollapseItem\[\]/);
  assert.match(navCollapse, /NAV_TREE_STORAGE_KEY = "civitas:nav-tree-expanded"/);
  assert.match(navCollapse, /setExpandedKeys\(\(current\) => current\.includes\(key\) \? current\.filter/);
  assert.match(navCollapse, /hidden=\{!expanded && !collapsed\}/);
  assert.match(navCollapse, /activeParentKeys\.slice\(0, 1\)/);
  assert.match(appShell, /children: \[/);
  assert.match(appShell, /SIDEBAR_STATE_STORAGE_KEY = "civitas:sidebar-state"/);
  assert.match(appShell, /effectiveSidebarCollapsed = isMobile \? false : sidebarCollapsed/);
  assert.match(appShell, /data-civitas-sidebar-state=\{sidebarState\}/);
  assert.match(appShell, /data-civitas-sidebar-mobile-state=\{mobileState\}/);
  assert.match(layoutCss, /@media \(max-width: 768px\) \{[\s\S]*?\.civitas-sidebar-toggle\s*\{\s*display: none;/s);
});

test("authenticated shell has explicit desktop and mobile scroll containers", () => {
  assert.match(stylesIndex, /html,\s*body,\s*#root\s*{[^}]*height: 100%;[^}]*overflow: hidden;/s);
  assert.match(layoutCss, /\.civitas-shell\s*{[^}]*height: 100vh;[^}]*height: var\(--civitas-viewport-height\);[^}]*overflow: hidden;/s);
  assert.match(layoutCss, /\.civitas-sidebar\s*{[^}]*height: 100vh;[^}]*height: var\(--civitas-viewport-height\);[^}]*overflow: hidden;/s);
  assert.match(layoutCss, /\.civitas-sidebar \.civitas-nav-row\s*{[^}]*min-height: 0;[^}]*overflow-y: auto;/s);
  assert.match(layoutCss, /@media \(max-width: 768px\) \{[\s\S]*?\.civitas-sidebar,[\s\S]*?height: var\(--civitas-nav-mobile-max-height\);[\s\S]*?overflow: hidden;/s);
  assert.match(layoutCss, /\.civitas-shell-content\s*{[^}]*overflow: hidden;/s);
  assert.match(layoutCss, /\.civitas-main\s*{[^}]*overflow-y: auto;[^}]*scrollbar-width: thin;/s);
  assert.match(layoutCss, /@media \(max-width: 768px\) \{[\s\S]*?\.civitas-shell\s*\{[\s\S]*?height: var\(--civitas-viewport-height\);[\s\S]*?overflow: hidden;/s);
  assert.match(layoutCss, /@media \(max-width: 768px\) \{[\s\S]*?\.civitas-shell-content\s*\{[\s\S]*?height: var\(--civitas-viewport-height\);[\s\S]*?overflow: hidden;/s);
  assert.match(layoutCss, /@media \(max-width: 768px\) \{[\s\S]*?\.civitas-main\s*\{[\s\S]*?overflow-y: auto;[\s\S]*?-webkit-overflow-scrolling: touch;/s);
  assert.match(layoutCss, /\.civitas-main > \*\s*{[^}]*max-width: min\(100%, 96rem\);/s);
  assert.match(layoutCss, /\.civitas-shell-sidebar-collapsed \.civitas-sidebar\s*{[^}]*overflow: visible;/s);
});
