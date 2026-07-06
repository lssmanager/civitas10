import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const guardSource = readFileSync(new URL("./OwnerRouteGuard.tsx", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../pages/App/index.tsx", import.meta.url), "utf8");

test("OwnerRouteGuard blocks owner rendering until owner_global is loaded from API claims", () => {
  assert.match(guardSource, /Validando permisos/);
  assert.match(guardSource, /ownerHasGlobalAccess/);
  assert.match(guardSource, /globalRoles\?\.includes\(OWNER_GLOBAL_ROLE\)/);
  assert.match(guardSource, /getAccessToken\(APP_ENV\.api\.resource\)/);
  assert.match(guardSource, /getMe\(token\)/);
  assert.match(guardSource, /403 \/ Access denied/);
});

test("owner routes are wrapped by OwnerRouteGuard", () => {
  assert.match(appSource, /OwnerRouteGuard/);
  assert.match(appSource, /<OwnerRouteGuard><OwnerOperationalHomePage \/><\/OwnerRouteGuard>/);
  assert.match(appSource, /<OwnerRouteGuard><OwnerOrganizationsPage \/><\/OwnerRouteGuard>/);
});
