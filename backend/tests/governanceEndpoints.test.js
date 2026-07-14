const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const source = readFileSync(join(__dirname, '../index.js'), 'utf8');

test('owner and tenant governance read-model endpoints are mounted and protected', () => {
  assert.match(source, /secureRoute\.get\("\/owner\/organizations\/:organizationId\/governance", "ownerRead", requireGlobalAccess\(\{ resource: API_RESOURCE, requiredScopes: \[OWNER_AUTHZ\.ownerProfileRead\] \}\), requireGlobalOwner, requireSafeOrganizationIdParam/);
  assert.match(source, /secureRoute\.get\("\/o\/:organizationId\/governance", "organizationMemberRead", requireSafeOrganizationIdParam, requireOrganizationAccess\(\{ requiredAllScopes: \[ORG_AUTHZ\.documentsRead\] \}\), requireOrg, requireOrganizationRole\(SHARED_AUTH\.organization\.roles\.member\), requirePermission\(ORG_AUTHZ\.documentsRead\)/);
  assert.match(source, /assertTenantRouteMatchesContext\(req\)/);
});
