import test from "node:test";
import assert from "node:assert/strict";
import sharedContract from "../../../dist/shared.contract.json" with { type: "json" };

const oidcLoginScopes = ["openid", "profile", "email", "offline_access"];
const ownerShellRequiredScopes = [
  sharedContract.auth.global.scopes.ownerRead,
  sharedContract.auth.global.scopes.organizationRead,
  sharedContract.auth.global.scopes.organizationCreate,
  sharedContract.auth.global.scopes.runtimeRead,
  sharedContract.auth.global.scopes.workerQueuesRead,
];
const logtoOwnerShellScopes = [...oidcLoginScopes, ...ownerShellRequiredScopes];

test("owner shell scope data matches the compiled shared contract", () => {
  assert.deepEqual(logtoOwnerShellScopes, [
    "openid",
    "profile",
    "email",
    "offline_access",
    "owner:read",
    "organization:read",
    "organization:create",
    "runtime:read",
    "worker-queues:read",
  ]);
});

test("simulated Logto authorize parameters include global owner scopes and Civitas API resource", () => {
  const authorizeParams = new URLSearchParams({
    client_id: "spa-app",
    redirect_uri: "https://civitas.didaxus.com/callback",
    response_type: "code",
    scope: logtoOwnerShellScopes.join(" "),
    resource: sharedContract.logto.apiResource,
  });
  assert.equal(authorizeParams.get("resource"), "https://civitas.didaxus.com/api");
  assert.deepEqual(authorizeParams.get("scope")?.split(" "), logtoOwnerShellScopes);
});

test("token diagnostic model distinguishes empty scope from complete owner scopes", () => {
  const emptyTokenScopes = "".split(/\s+/).filter(Boolean);
  const completeTokenScopes = ownerShellRequiredScopes;
  assert.deepEqual(ownerShellRequiredScopes.filter((scope) => !emptyTokenScopes.includes(scope)), ownerShellRequiredScopes);
  assert.deepEqual(ownerShellRequiredScopes.filter((scope) => !completeTokenScopes.includes(scope)), []);
});
