import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const routes = readFileSync(new URL("./routes.ts", import.meta.url), "utf8");
const builders = readFileSync(new URL("./route-builders.ts", import.meta.url), "utf8");
const appShell = readFileSync(new URL("../layouts/AppShell.tsx", import.meta.url), "utf8");
const ownerLayout = readFileSync(new URL("../layouts/OwnerLayout.tsx", import.meta.url), "utf8");
const orgLayout = readFileSync(new URL("../layouts/OrganizationLayout.tsx", import.meta.url), "utf8");
const governancePage = readFileSync(new URL("../features/governance/GovernanceStudioPage.tsx", import.meta.url), "utf8");

test("owner topology matches #111 hierarchy", () => {
  assert.match(routes, /structuralRoute\("\/owner\/overview-section", "Overview"[\s\S]*appRoutes\.ownerOrganizationGovernance[\s\S]*"Worker runtime"/);
  assert.match(routes, /structuralRoute\("\/owner\/organizations-section", "Organizations"[\s\S]*appRoutes\.ownerOrganizations[\s\S]*appRoutes\.ownerCreateOrganization[\s\S]*appRoutes\.ownerOrganizationState/);
  assert.match(routes, /structuralRoute\("\/owner\/settings-section", "Settings"[\s\S]*appRoutes\.ownerBranding[\s\S]*appRoutes\.ownerRoleMapping[\s\S]*appRoutes\.ownerPlatformSettings/);
  assert.doesNotMatch(routes, /Configuration/);
  assert.match(routes, /ownerOrganizations: appRoute\([^,]+, "Directory"/);
});

test("tenant topology is declared and organization-scoped", () => {
  assert.match(routes, /export const tenantNavigationTree/);
  assert.match(routes, /tenantGovernanceRoute = defineRoute\("\/o\/:organizationId\/settings\/governance"\)/);
  assert.match(routes, /tenantLmsGradesRoute = defineRoute\("\/o\/:organizationId\/lms\/grades"\)/);
  assert.match(orgLayout, /materializeNavigationTree\(tenantNavigationTree, \{ organizationId \}\)/);
});

test("route builders reject missing and literal placeholders", () => {
  assert.match(builders, /String\(value\) === placeholder/);
  assert.match(builders, /encodeURIComponent\(String\(value\)\)/);
  assert.doesNotMatch(governancePage, /%3AorganizationId/);
  assert.doesNotMatch(governancePage, /`\/owner\/organizations\/\$\{encodeURIComponent\(organizationId\)\}\/governance`/);
});

test("AppShell has explicit missing-navigation failure instead of empty fallback", () => {
  assert.doesNotMatch(appShell, /emptyNavItems/);
  assert.match(appShell, /navigation-required-but-empty/);
  assert.match(appShell, /Resolved navigation is required/);
  assert.match(ownerLayout, /ownerNavigationTree/);
  assert.match(ownerLayout, /materializeNavigationTree/);
});
