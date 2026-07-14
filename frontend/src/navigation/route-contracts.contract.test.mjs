import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const routes = readFileSync(new URL("./routes.ts", import.meta.url), "utf8");
const builders = readFileSync(new URL("./route-builders.ts", import.meta.url), "utf8");
const appShell = readFileSync(new URL("../layouts/AppShell.tsx", import.meta.url), "utf8");
const navAdapter = readFileSync(new URL("./nav-item-adapter.ts", import.meta.url), "utf8");
const iconRegistry = readFileSync(new URL("./icon-registry.ts", import.meta.url), "utf8");
const ownerLayout = readFileSync(new URL("../layouts/OwnerLayout.tsx", import.meta.url), "utf8");
const orgLayout = readFileSync(new URL("../layouts/OrganizationLayout.tsx", import.meta.url), "utf8");
const governancePage = readFileSync(new URL("../features/governance/GovernanceStudioPage.tsx", import.meta.url), "utf8");

test("owner topology v2 matches product-validated hierarchy", () => {
  assert.match(routes, /OWNER_NAVIGATION_CONTRACT_VERSION = 2/);
  assert.match(routes, /owner: appRoute\(ownerRoute, "Overview", "overview"/);
  assert.match(routes, /ownerGovernance: appRoute\(ownerGovernanceRoute, "Governance", "governance"/);
  assert.match(routes, /ownerSystem: appRoute\(ownerSystemRoute, "Operations", "operations"/);
  assert.match(routes, /export const ownerNavigationTree[\s\S]*appRoutes\.owner,[\s\S]*appRoutes\.ownerGovernance,[\s\S]*appRoutes\.ownerSystem,[\s\S]*"Organizations"[\s\S]*appRoutes\.ownerOrganizations[\s\S]*appRoutes\.ownerCreateOrganization/);
  assert.doesNotMatch(routes, /Operational overview/);
  assert.doesNotMatch(routes, /Worker runtime/);
  assert.doesNotMatch(routes, /appRoutes\.ownerOrganizationState\]/);
  assert.match(routes, /appRoutes\.account\.active \? \[appRoutes\.account\] : \[\]/);
  assert.doesNotMatch(routes, /Configuration/);
});

test("settings and profile are not published when inactive", () => {
  assert.match(routes, /ownerBranding:[\s\S]*false\)/);
  assert.match(routes, /ownerRoleMapping:[\s\S]*false\)/);
  assert.match(routes, /ownerPlatformSettings:[\s\S]*false\)/);
  assert.match(routes, /account:[\s\S]*false\)/);
  assert.match(routes, /settingsChildren\.length \? \[structuralRoute/);
  assert.match(routes, /appRoutes\.account\.active \? \[appRoutes\.account\] : \[\]/);
});

test("tenant topology is declared and organization-scoped", () => {
  assert.match(routes, /export const tenantNavigationTree/);
  assert.match(routes, /tenantGovernanceRoute = defineRoute\("\/o\/:organizationId\/settings\/governance"\)/);
  assert.match(routes, /tenantLmsGradesRoute = defineRoute\("\/o\/:organizationId\/lms\/grades"\)/);
  assert.match(orgLayout, /materializeNavigationTree\(tenantNavigationTree, \{ organizationId \}\)/);
});

test("icon IDs are contractual and unknown icon IDs fail before fallback", () => {
  for (const iconId of ["overview", "governance", "operations", "organizations", "directory", "create", "settings", "profile"]) {
    assert.match(iconRegistry, new RegExp(`${iconId}: Icon`));
  }
  assert.match(navAdapter, /throw new Error\(`Unknown navigation iconId/);
  assert.match(navAdapter, /console\.warn\(`Unknown navigation iconId/);
  assert.doesNotMatch(navAdapter, /iconRegistry\.dashboard/);
});

test("route builders reject missing and literal placeholders", () => {
  assert.match(builders, /String\(value\) === placeholder/);
  assert.match(builders, /encodeURIComponent\(String\(value\)\)/);
  assert.doesNotMatch(governancePage, /%3AorganizationId/);
  assert.doesNotMatch(governancePage, /`\/owner\/organizations\/\$\{encodeURIComponent\(organizationId\)\}\/governance`/);
});

test("AppShell has explicit missing-navigation failure and no desktop collapsed rail", () => {
  assert.doesNotMatch(appShell, /emptyNavItems/);
  assert.match(appShell, /navigation-required-but-empty/);
  assert.match(appShell, /Resolved navigation is required/);
  assert.doesNotMatch(appShell, /SIDEBAR_STATE_STORAGE_KEY|sidebarCollapsed|localStorage|civitas-shell-sidebar-collapsed|civitas-sidebar-toggle/);
  assert.match(ownerLayout, /ownerNavigationTree/);
  assert.match(ownerLayout, /materializeNavigationTree/);
});
