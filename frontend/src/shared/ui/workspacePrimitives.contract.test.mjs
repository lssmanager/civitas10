import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const sharedRoot = new URL("./", import.meta.url);
const sharedRootPath = fileURLToPath(sharedRoot);
const index = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
const primitivesCss = readFileSync(new URL("../../styles/primitives.css", import.meta.url), "utf8");
const tokensCss = readFileSync(new URL("../../styles/tokens.css", import.meta.url), "utf8");
const patternFixtures = readFileSync(new URL("./patterns/fixtures.ts", import.meta.url), "utf8");

const readSharedFiles = (dir = sharedRootPath) => readdirSync(dir).flatMap((entry) => {
  const path = join(dir, entry);
  const stat = statSync(path);
  if (stat.isDirectory()) return readSharedFiles(path);
  return /\.(ts|tsx)$/.test(entry) ? [path] : [];
});

test("#130 exports all governance primitives and contractual patterns from shared/ui", () => {
  for (const symbol of ["OrganizationContextHeader", "GovernanceSectionNav", "RoleSelector", "PermissionGroupAccordion", "FilterBar", "SplitView", "MetricStrip", "DecisionState", "EntityWorkspace", "SettingsWorkbench", "MasterDetail", "GroupedToggleList", "HierarchyWorkbench", "FilterToolbar", "FormDrawer", "ResponsiveDataView"]) {
    assert.match(index, new RegExp(symbol));
  }
});

test("workspace primitives use semantic Civitas CSS contracts instead of raw visual decisions", () => {
  const files = readSharedFiles();
  for (const file of files) {
    const rel = relative(sharedRootPath, file);
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(|shadow-\[|grid-cols-\[/, `${rel} must not contain raw color or arbitrary layout values`);
    assert.doesNotMatch(text, /from "\.\.\/\.\.\/features|fetch\(|useLogto|role ===|roles\.includes/, `${rel} must remain feature/authz agnostic`);
  }
});

test("canonical tokens expose workspace geometry once and primitives consume those tokens", () => {
  for (const token of ["--civitas-workspace-rail-width", "--civitas-workspace-gap", "--civitas-split-detail-width", "--civitas-form-drawer-width"]) {
    assert.match(tokensCss, new RegExp(token));
    assert.match(primitivesCss, new RegExp(`var\\(${token}\\)`));
  }
  assert.match(primitivesCss, /\.civitas-workspace-shell/);
  assert.match(primitivesCss, /\.civitas-form-drawer/);
});


test("pattern fixtures cover realistic governance states without semantic aliases", () => {
  for (const state of ["loading", "empty", "error", "denied", "stale"]) assert.match(patternFixtures, new RegExp(state));
  assert.match(patternFixtures, /organization_groupleader/);
  assert.match(patternFixtures, /lms\.groups\.read/);
  assert.doesNotMatch(patternFixtures, /role ===|owner_global|wildcard|domain\.\*/);
});
