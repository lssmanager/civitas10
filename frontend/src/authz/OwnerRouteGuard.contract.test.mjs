import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const guardSource = readFileSync(new URL("./OwnerRouteGuard.tsx", import.meta.url), "utf8");
const ownerScopesSource = readFileSync(new URL("./ownerScopes.ts", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../pages/App/index.tsx", import.meta.url), "utf8");

test("OwnerRouteGuard blocks owner rendering until owner_global and global scopes are loaded from API claims", () => {
  assert.match(guardSource, /Validando permisos/);
  assert.match(guardSource, /ownerHasGlobalRole/);
  assert.match(ownerScopesSource, /globalRoles\?\.includes\(OWNER_GLOBAL_ROLE\)/);
  assert.match(guardSource, /getMissingOwnerShellScopes/);
  assert.match(guardSource, /getAccessTokenDiagnostics/);
  assert.match(guardSource, /missing required global API permissions/);
  assert.match(guardSource, /getAccessToken\(APP_ENV\.api\.resource\)/);
  assert.match(guardSource, /getMe\(token\)/);
  assert.match(guardSource, /403 \/ Access denied/);
});

test("owner route guard has explicit passing, missing role and missing scope branches", () => {
  assert.match(guardSource, /setState\(\{ status: "authorized", me \}\)/);
  assert.match(guardSource, /reason: "global-role"/);
  assert.match(guardSource, /reason: "global-scopes"/);
  assert.doesNotMatch(guardSource, /getOrganizationToken/);
});

test("owner shell required scopes come from the shared Civitas contract", () => {
  for (const scopeKey of ["read", "organizationsRead", "organizationsCreate", "runtimeRead", "workerQueuesRead"]) {
    assert.match(ownerScopesSource, new RegExp(`OWNER_SCOPES\\.${scopeKey}`));
  }
  assert.match(ownerScopesSource, /LOGTO_OWNER_SHELL_SCOPES/);
  assert.match(ownerScopesSource, /OIDC_LOGIN_SCOPES/);
  assert.match(ownerScopesSource, /getMissingScopes/);
});

test("owner routes are wrapped by OwnerRouteGuard and ScreenGate", () => {
  assert.match(appSource, /OwnerRouteGuard/);
  assert.match(appSource, /ScreenGate screenId="owner-overview"/);
  assert.match(appSource, /ScreenGate screenId="owner-organizations"/);
  assert.match(appSource, /ScreenGate screenId="owner-organizations-create"/);
  assert.match(appSource, /ScreenGate screenId="owner-governance"/);
});
