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
  assert.match(primitivesCss, /\.civitas-stack-md\s*{\s*grid-template-columns: 1fr !important;/s);
  assert.match(primitivesCss, /\.civitas-kpi-grid\s*{[^}]*repeat\(auto-fit, minmax\(min\(100%, 10rem\), 1fr\)\)/s);
  assert.match(sectionCard, /civitas-pad-tight-md/);
  assert.match(dataTable, /civitas-table-wrap civitas-scroll-x/);
});

test("navigation is provided by the shared NavCollapse primitive", () => {
  assert.match(barrel, /NavCollapse/);
  assert.match(appShell, /<NavCollapse/);
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
  assert.match(layoutCss, /\.civitas-shell-sidebar-collapsed \.civitas-sidebar \.civitas-nav-row\s*{[^}]*overflow: visible;/s);
  assert.match(layoutCss, /\.civitas-shell-sidebar-collapsed \.civitas-nav-tree-group:hover \.civitas-nav-tree-children,[\s\S]*?left: calc\(100% \+ var\(--civitas-popover-offset\)\);[\s\S]*?z-index: var\(--civitas-z-nav-flyout\);/s);
});

test("sidebar nav geometry computes from one canonical token family", () => {
  const readDeclarations = (selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = [...layoutCss.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "g"))];
    assert.ok(matches.length, `Missing CSS selector: ${selector}`);
    return Object.fromEntries(matches[0][1].split(";").map((entry) => entry.trim()).filter(Boolean).map((entry) => {
      const [property, ...value] = entry.split(":");
      return [property.trim(), value.join(":").trim()];
    }));
  };
  const rootTokens = Object.fromEntries([...tokensCss.matchAll(/(--civitas-[\w-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));
  const resolveTokens = (value, localTokens = {}) => value.replace(/var\((--civitas-[\w-]+)\)/g, (_, token) => resolveTokens(localTokens[token] || rootTokens[token] || "", localTokens));
  const toRemNumber = (value, localTokens = {}) => {
    const resolved = resolveTokens(value, localTokens).replace(/calc\((.*)\)/, "$1").trim();
    const normalized = resolved.replace(/([0-9.]+)rem/g, "$1").replace(/\s*\*\s*/g, "*");
    return normalized.split("+").map((part) => {
      const term = part.trim();
      if (term.includes("*")) {
        return term.split("*").map(Number).reduce((product, number) => product * number, 1);
      }
      return Number(term);
    }).reduce((sum, number) => sum + number, 0);
  };

  const header = readDeclarations(".civitas-shell-sidebar-collapsed .civitas-sidebar-brand-row");
  const parent = { ...readDeclarations(".civitas-sidebar .civitas-nav-link"), "--civitas-nav-depth-offset": "0rem" };
  const child = { ...parent, ...readDeclarations('.civitas-sidebar .civitas-nav-link[data-depth="1"]') };
  const collapsedParent = { ...parent, ...readDeclarations(".civitas-shell-sidebar-collapsed .civitas-sidebar .civitas-nav-link") };
  const button = readDeclarations(".civitas-sidebar-toggle");
  const icon = readDeclarations(".civitas-nav-link-icon");

  const headerPadding = toRemNumber(header["padding-left"]);
  const parentPadding = toRemNumber(parent["padding-left"], parent);
  const collapsedParentPadding = toRemNumber(collapsedParent["padding-left"], collapsedParent);
  const childPadding = toRemNumber(child["padding-left"], child);
  const basePadding = toRemNumber("var(--civitas-nav-item-padding-x)");
  const childIndent = toRemNumber("var(--civitas-nav-child-indent)");

  assert.equal(headerPadding, basePadding);
  assert.equal(parentPadding, basePadding);
  assert.equal(collapsedParentPadding, basePadding);
  assert.equal(childPadding, basePadding + childIndent);
  assert.equal(toRemNumber(parent.height, parent), toRemNumber("var(--civitas-nav-item-height)"));
  assert.equal(toRemNumber(child["min-height"], child), toRemNumber("var(--civitas-nav-item-height)"));
  assert.equal(toRemNumber(icon.width), toRemNumber("var(--civitas-nav-icon-size)"));
  assert.equal(toRemNumber(icon.height), toRemNumber("var(--civitas-nav-icon-size)"));
  assert.equal(toRemNumber(button.width), toRemNumber("var(--civitas-nav-collapse-button-size)"));
  assert.equal(toRemNumber(button.height), toRemNumber("var(--civitas-nav-collapse-button-size)"));
  const collapsedIcon = readDeclarations(".civitas-shell-sidebar-collapsed .civitas-sidebar .civitas-nav-link-icon");
  assert.equal(collapsedIcon.width, undefined);
  assert.equal(collapsedIcon.height, undefined);
});
