import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("./GovernanceStudioPage.tsx", import.meta.url), "utf8");
const contracts = readFileSync(new URL("./contracts.ts", import.meta.url), "utf8");
const api = readFileSync(new URL("./api.ts", import.meta.url), "utf8");
const routes = readFileSync(new URL("../../navigation/routes.ts", import.meta.url), "utf8");
const registry = readFileSync(new URL("./visual/governance.screen.ts", import.meta.url), "utf8");
const matrix = readFileSync(new URL("./modules/permission-matrix/PermissionMatrixModule.tsx", import.meta.url), "utf8");
const reasonFormat = readFileSync(new URL("./modules/permission-matrix/reason-format.ts", import.meta.url), "utf8");
const dataScope = readFileSync(new URL("./modules/data-scope/DataScopeModule.tsx", import.meta.url), "utf8");
const accessPreview = readFileSync(new URL("./modules/access-preview/AccessPreviewModule.tsx", import.meta.url), "utf8");
const routeCatalogSource = readFileSync(new URL("../../navigation/route-catalog.ts", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../../pages/App/index.tsx", import.meta.url), "utf8");
const evaluator = readFileSync(new URL("../../authorization/evaluation/evaluate-screen.ts", import.meta.url), "utf8");

test("governance studio exposes separate owner and tenant surfaces", () => {
  assert.match(routes, /ownerOrganizationGovernance/);
  assert.match(routes, /\/owner\/organizations\/:organizationId\/governance/);
  assert.match(routes, /tenantGovernance/);
  assert.match(routes, /\/o\/:organizationId\/settings\/governance/);
  assert.match(registry, /owner-governance/);
  assert.match(registry, /route: routeCatalog\.ownerOrganizationGovernance/);
  assert.match(registry, /requiresOrganizationContext: false/);
  assert.match(routeCatalogSource, /ownerOrganizationGovernance:[\s\S]*"platform"/);
  assert.match(appSource, /ScreenGate screenId="owner-governance"/);
  assert.doesNotMatch(appSource, /ScreenGate screenId="owner-organization-governance"/);
  assert.match(registry, /tenant-governance/);
  assert.match(routeCatalogSource, /tenantGovernance: route\("tenant\.settings\.governance", appRoutes\.tenantGovernance\.path, "tenant", "tenant"\)/);
});

test("context scopes preserve owner platform access and tenant organization enforcement", () => {
  assert.match(registry, /screenId: "owner-governance"[\s\S]*requiresOrganizationContext: false/);
  assert.match(routeCatalogSource, /const route = \(routeId: string, path: string, scope: RouteReference\["scope"\], contextScope: RouteReference\["contextScope"\]/);
  assert.match(routeCatalogSource, /ownerOrganizationGovernance: route\("owner\.organizations\.governance", appRoutes\.ownerOrganizationGovernance\.path, "owner", "platform"\)/);
  assert.match(registry, /screenId: "tenant-governance"[\s\S]*requiresOrganizationContext: true/);
  assert.match(routeCatalogSource, /tenantGovernance: route\("tenant\.settings\.governance", appRoutes\.tenantGovernance\.path, "tenant", "tenant"\)/);
  assert.match(evaluator, /requiresOrganizationContext && !context\.organizationId/);
});

test("governance sections are route-backed vertical navigation", () => {
  assert.match(routes, /governance\/roles/);
  assert.match(routes, /governance\/taxonomy/);
  assert.match(routes, /governance\/groups/);
  assert.match(routes, /governance\/data-scopes/);
  assert.match(routes, /governance\/navigation/);
  assert.match(routes, /governance\/preview/);
  assert.match(routes, /governance\/audit/);
  assert.match(page, /SectionNavigation/);
  assert.match(page, /aria-label="Breadcrumb"/);
  assert.doesNotMatch(page, /<Tabs|useSearchParams/);
});

test("governance read model keeps concepts and reason versions separated", () => {
  for (const field of ["canonical", "rolePotential", "ownerAllowed", "tenantEnabled", "effective", "reason"]) {
    assert.match(contracts, new RegExp(field));
    assert.match(matrix, new RegExp(field));
  }
  assert.match(contracts, /type PermissionMatrixReason/);
  assert.match(contracts, /sourceVersions/);
  assert.match(matrix, /formatSourceVersions/);
  assert.match(matrix + reasonFormat, /not_canonical/);
  assert.match(matrix + reasonFormat, /ceiling_not_authorized/);
  assert.match(matrix, /Not applicable/);
  assert.match(contracts, /taxonomyIds/);
  assert.match(contracts, /unitIds/);
  assert.match(dataScope, /DataTable/);
  assert.match(dataScope, /No data-scope assignments/);
});

test("governance page is an aggregate read model, not a write authority", () => {
  assert.match(api, /ownerApiFetch\(`\/owner\/organizations\/\$\{encodeURIComponent\(organizationId\)\}\/governance`\)/);
  assert.match(api, /access-preview/);
  assert.doesNotMatch(api, /createScope|createRole|lms\.\*|org\.members\.\*/);
  assert.doesNotMatch(page, /no client Logto Management API|Feature writes stay in their owning services|Governance boundary|no wildcards|visual preferences only subtract|backend remains authority|The UI stays read-only and does not fetch/);
});

test("access preview is read-only and does not mutate grants", () => {
  assert.match(accessPreview, /Read-only/);
  assert.match(accessPreview, /Access preview is not available yet/);
  assert.match(accessPreview, /DataTable/);
  assert.match(api, /previewOwnerAccessReadOnly/);
  assert.match(api, /previewTenantAccessReadOnly/);
  assert.match(api, /X-Civitas-Preview-Only/);
  assert.match(api, /previewOnly: true/);
  assert.doesNotMatch(accessPreview, /setModel|tenantEnabled|ownerAllowed|org_role_grants|grantRole|createGrant/);
});

test("governance modules are feature-owned and responsive-neutral", () => {
  for (const moduleName of ["OverviewModule", "PermissionMatrixModule", "MembersRoleAssignmentsModule", "TaxonomyModule", "UnitsModule", "DataScopeModule", "AliasesNavigationModule", "AccessPreviewModule", "AuditDiagnosticsModule"]) {
    assert.match(page, new RegExp(moduleName));
  }
  assert.doesNotMatch(page, /innerWidth|matchMedia|role ===|roles\.includes/);
});


test("governance unavailable operations prevent blind fetches", () => {
  const capabilities = readFileSync(new URL("./governance-capabilities.ts", import.meta.url), "utf8");
  assert.match(capabilities, /operation-registry\.generated\.json/);
  const artifact = JSON.parse(readFileSync(new URL("./operation-registry.generated.json", import.meta.url), "utf8"));
  assert.equal(artifact.operations.find((entry) => entry.operationId === "governance.readModel" && entry.surface === "owner").status, "active");
  assert.equal(artifact.operations.find((entry) => entry.operationId === "governance.accessPreview" && entry.surface === "owner").status, "unavailable");
  assert.match(page, /!isGovernanceOperationActive\(surface, "governance.readModel"\)/);
  assert.match(page, /!isGovernanceOperationActive\(model.surface, "governance.accessPreview"\)/);
});


test("governance read model contract validates real mounted fixture", () => {
  const contract = readFileSync(new URL("./contracts.ts", import.meta.url), "utf8");
  const fixture = JSON.parse(readFileSync(new URL("./fixtures/governance-read-model-owner.json", import.meta.url), "utf8"));
  assert.equal(fixture.contractVersion, "2026-07-civitas10-governance-read-model-v1");
  assert.equal(fixture.modules.permissions.status, "active");
  assert.equal(fixture.modules.taxonomy.status, "active");
  assert.equal(fixture.modules["access-preview"].status, "unavailable");
  assert.ok(Array.isArray(fixture.operationRegistry.operations));
  assert.ok(fixture.taxonomy.length > 0);
  assert.ok(fixture.units.length > 0);
  assert.ok(fixture.dataScopes.length > 0);
  assert.equal(fixture.roles[0].canonicalKey, "organization_admin");
  assert.equal(fixture.members[0].display.startsWith("sub_"), true);
  assert.equal(JSON.stringify(fixture).includes("secret@example.test"), false);
  assert.match(contract, /validateGovernanceReadModel/);
  assert.match(contract, /\$\.modules.\$\{key\}\.status/);
  assert.match(contract, /\$\.operationRegistry\.operations/);
  assert.match(contract, /GovernanceRoleSummary/);
  assert.match(contract, /GovernanceMemberSummary/);
  assert.match(api, /assertGovernanceReadModel/);
});
