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

const catalogs = readFileSync(new URL("./registry/catalogs.ts", import.meta.url), "utf8");
const compiler = readFileSync(new URL("./registry/compile-visual-registry.ts", import.meta.url), "utf8");
const validator = readFileSync(new URL("./registry/validate-visual-registry.ts", import.meta.url), "utf8");
const ownerRuntimeScreen = readFileSync(new URL("../features/owner/runtime/runtime.screen.ts", import.meta.url), "utf8");
const ownerRuntimeActions = readFileSync(new URL("../features/owner/runtime/runtime.actions.ts", import.meta.url), "utf8");
const visualProvider = readFileSync(new URL("./components/VisualAuthorizationProvider.tsx", import.meta.url), "utf8");

test("visual registry is catalog-bound and cannot elevate absent governance aliases", () => {
  for (const legacyId of ["owner.read", "owner.write", "owner.system.read", "account.profile.read", "lms.grades.read", "lms.grades.manage", "analytics.reports.read", "governance.owner.read", "governance.tenant.read", "governance.preview.read"]) {
    assert.doesNotMatch(registry + catalogs + visualProvider, new RegExp(legacyId.replaceAll(".", "\\.")));
  }
  assert.match(validator, /registry_catalog_mismatch/);
  assert.match(validator, /consumer_surface_mismatch/);
  assert.match(validator, /activePermissions\.has\(permission/);
});

test("visual registry carries catalog hash, role model version and snapshot provenance", () => {
  assert.match(catalogs, /authorizationCatalogHash/);
  assert.match(catalogs, /roleModelVersion/);
  assert.match(compiler, /snapshotProvenance/);
  assert.match(compiler, /catalogHash/);
});

test("owner runtime read and execution use independent visual guards", () => {
  assert.match(ownerRuntimeScreen, /owner\.runtime\.read/);
  assert.doesNotMatch(ownerRuntimeScreen, /owner\.runtime\.operations\.execute/);
  assert.match(ownerRuntimeActions, /owner\.runtime\.operations\.execute/);
  assert.doesNotMatch(ownerRuntimeActions, /owner\.runtime\.read/);
});
