import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const registry = readFileSync(new URL("./registry/index.ts", import.meta.url), "utf8");
const evaluator = readFileSync(new URL("./evaluation/evaluate-screen.ts", import.meta.url), "utf8");
const actionEvaluator = readFileSync(new URL("./evaluation/evaluate-action.ts", import.meta.url), "utf8");
const can = readFileSync(new URL("./components/Can.tsx", import.meta.url), "utf8");
const gate = readFileSync(new URL("./components/ScreenGate.tsx", import.meta.url), "utf8");
const nav = readFileSync(new URL("../navigation/build-navigation-tree.ts", import.meta.url), "utf8");
const shell = readFileSync(new URL("../layouts/AppShell.tsx", import.meta.url), "utf8");

test("visual registry is modular and compiled", () => {
  assert.match(registry, /compileVisualRegistry/);
  assert.match(registry, /features\/owner\/organizations\/organizations\.screen/);
  assert.doesNotMatch(registry, /uiManifest/);
});

test("evaluators deny before visual preferences and never use viewport", () => {
  assert.match(evaluator, /organization_context_missing/);
  assert.match(evaluator, /all_permissions_missing/);
  assert.match(evaluator, /data_scope_unavailable/);
  assert.match(evaluator, /organization_preference_hidden/);
  assert.doesNotMatch(evaluator + actionEvaluator, /viewport|innerWidth|matchMedia|role ===|roles\.includes/);
});

test("Can and ScreenGate consume action and screen IDs from the registry", () => {
  assert.match(can, /actionById/);
  assert.match(can, /evaluateActionEligibility/);
  assert.doesNotMatch(can, /role\?:|permission\?:/);
  assert.match(gate, /screenById/);
  assert.match(gate, /organization_context_missing|feature_disabled/);
});

test("navigation is derived recursively and AppShell remains renderer-only", () => {
  assert.match(nav, /buildNavigationTree/);
  assert.match(nav, /resolveScreenVisibility/);
  assert.match(nav, /parentMenuKey/);
  assert.doesNotMatch(shell, /defaultOwnerNavItems/);
  assert.match(shell, /<NavCollapse items=\{resolvedNavItems\}/);
});
