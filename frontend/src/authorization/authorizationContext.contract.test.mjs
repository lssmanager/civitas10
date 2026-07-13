import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const client = readFileSync(new URL("./authorization-client.ts", import.meta.url), "utf8");
const provider = readFileSync(new URL("./AuthorizationProvider.tsx", import.meta.url), "utf8");
const checker = readFileSync(new URL("./permission-checker.ts", import.meta.url), "utf8");
const app = readFileSync(new URL("../pages/App/index.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../pages/App/Dashboard.tsx", import.meta.url), "utf8");

test("tenant authorization context is loaded from the backend effective context endpoint", () => {
  assert.match(client, /\/o\/\$\{encodeURIComponent\(organizationId\)\}\/me\/authorization-context/);
  assert.match(client, /effectivePermissions/);
  assert.match(client, /effectiveActions/);
  assert.match(client, /dataScopeSummary/);
  assert.match(checker, /effectivePermissions: new Set/);
  assert.doesNotMatch(checker, /tokenPermissions\.map/);
});

test("tenant authorization provider invalidates on organization and auth changes and fails closed", () => {
  assert.match(provider, /status: "loading"/);
  assert.match(provider, /status: "unauthenticated"/);
  assert.match(provider, /status: "error"/);
  assert.match(provider, /organizationId\]\)/);
  assert.match(app, /TenantAuthorizationProvider organizationId=\{organizationId\}/);
  assert.match(app, /ScreenGate screenId="tenant-governance"/);
});

test("legacy rbac matrix has no consumers and is removed", () => {
  assert.equal(existsSync(new URL("../authz/rbacMatrix.ts", import.meta.url)), false);
  assert.doesNotMatch(dashboard, /RBACMatrix|evaluateCapabilityRule|requiredGlobalRoles|requiredOwnerScopes/);
});
