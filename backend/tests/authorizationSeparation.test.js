const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

test("global auth middleware rejects organization context and enforces scopes", () => {
  const source = readFileSync(join(__dirname, "..", "middleware", "auth.js"), "utf8");
  assert.match(source, /const requireGlobalAccess/);
  assert.match(source, /GLOBAL_TOKEN_REQUIRED/);
  assert.match(source, /hasRequiredScopes\(scopes, requiredScopes\)/);
  assert.match(source, /const payload = await verifyJwt\(token, resource\)/);
  assert.match(source, /Invalid Logto API Resource drift detected/);
  assert.doesNotMatch(source, /process\.env\.LOGTO_API_RESOURCE/);
  assert.match(source, /deploymentConfig\.logtoResource/);
});

test("owner routes use global access while tenant routes keep organization access", () => {
  const source = readFileSync(join(__dirname, "..", "index.js"), "utf8");
  assert.match(source, /secureRoute\.get\("\/owner\/me", "ownerRead", requireGlobalAccess\(\{ resource: API_RESOURCE, requiredScopes: \[OWNER_SCOPES.ownerRead\] \}\), requireGlobalOwner/);
  assert.match(source, /secureRoute\.get\("\/owner\/organization-template", "ownerRead", requireGlobalAccess\(\{ resource: API_RESOURCE, requiredScopes: \[OWNER_SCOPES.organizationRead\] \}\), requireGlobalOwner/);
  assert.match(source, /secureRoute\.get\("\/owner\/organizations", "ownerRead", requireGlobalAccess\(\{ resource: API_RESOURCE, requiredScopes: \[OWNER_SCOPES.organizationRead\] \}\), requireGlobalOwner/);
  assert.match(source, /secureRoute\.post\(\["\/owner\/organizations", "\/organizations"\], "ownerSensitiveWrite", requireGlobalAccess\(\{ resource: API_RESOURCE, requiredScopes: \[OWNER_SCOPES.organizationCreate\] \}\), requireGlobalOwner/);
  assert.match(source, /secureRoute\.get\("\/documents", "organizationMemberRead", requireOrganizationAccess\(\{ requiredScopes: \["read:documents"\] \}\), requireOrganizationRole\(SHARED_AUTH.organization.roles.member\)/);
  assert.match(source, /secureRoute\.post\("\/documents", "organizationAdminWrite", requireOrganizationAccess\(\{ requiredScopes: \["create:documents"\] \}\), requireOrganizationRole\(SHARED_AUTH.organization.roles.admin\)/);
});

test("Logto management service uses deployment kernel configuration explicitly", () => {
  const source = readFileSync(join(__dirname, "..", "services", "logtoManagement.js"), "utf8");
  assert.match(source, /const \{ validateDeploymentConfig \} = require\("\.\.\/\.\.\/core\/deployment\/deployment-kernel\.cjs"\)/);
  assert.match(source, /deploymentConfigCache = validateDeploymentConfig\(\{ service: "backend" \}\)/);
  assert.match(source, /deploymentConfig\.logtoEndpoint/);
  assert.match(source, /resource: deploymentConfig\.logtoManagementApi/);
  assert.match(source, /LOGTO_MANAGEMENT_API_RESOURCE/);
  assert.doesNotMatch(source, /resource: deploymentConfig\.logtoEndpoint/);
});


test("organization auth rejects mismatched logical API audience", () => {
  const source = readFileSync(join(__dirname, "..", "middleware", "auth.js"), "utf8");
  assert.match(source, /if \(!hasAudience\(decodedPayload\.aud, resource\)\)/);
  assert.match(source, /Invalid organization token audience/);
  assert.match(source, /const payload = await verifyJwt\(token, resource\)/);
});
