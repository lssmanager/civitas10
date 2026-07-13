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

test("governance studio exposes separate owner and tenant surfaces", () => {
  assert.match(routes, /ownerOrganizationGovernance/);
  assert.match(routes, /\/owner\/organizations\/:organizationId\/governance/);
  assert.match(routes, /tenantGovernance/);
  assert.match(routes, /\/o\/:organizationId\/settings\/governance/);
  assert.match(registry, /owner-organization-governance/);
  assert.match(registry, /tenant-governance/);
});

test("governance tabs are explicit and asymmetric by surface", () => {
  assert.match(page, /ownerGovernanceTabs: GovernanceModuleKey\[] = \["overview", "permissions", "taxonomy", "units", "data-scope", "aliases-navigation", "access-preview", "audit"\]/);
  assert.match(page, /tenantGovernanceTabs: GovernanceModuleKey\[] = \["permissions", "members", "data-scope", "taxonomy", "units", "aliases-navigation", "access-preview"\]/);
  assert.match(page, /Members and role assignments/);
  assert.doesNotMatch(page, /tenantGovernanceTabs[\s\S]*"audit"/);
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
  assert.match(matrix, /aria-label="not applicable"/);
  assert.match(contracts, /taxonomyIds/);
  assert.match(contracts, /unitIds/);
  assert.match(dataScope, /resource filtering stays server-side/);
});

test("governance page is an aggregate read model, not a write authority", () => {
  assert.match(api, /ownerApiFetch\(`\/owner\/organizations\/\$\{encodeURIComponent\(organizationId\)\}\/governance`\)/);
  assert.match(api, /access-preview/);
  assert.doesNotMatch(api, /createScope|createRole|lms\.\*|org\.members\.\*/);
  assert.match(page, /no client Logto Management API/);
  assert.match(page, /Feature writes stay in their owning services/);
});

test("access preview is read-only and does not mutate grants", () => {
  assert.match(accessPreview, /preview — no muta estado/);
  assert.match(accessPreview, /data-access-preview-decision/);
  assert.match(accessPreview, /data-access-preview-explanation/);
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
  assert.match(capabilities, /governanceOperationRegistry/);
  assert.match(capabilities, /operation: "governance.readModel"[\s\S]*status: "unavailable"/);
  assert.match(capabilities, /operation: "governance.accessPreview"[\s\S]*status: "unavailable"/);
  assert.match(page, /!isGovernanceOperationActive\(surface, "governance.readModel"\)/);
  assert.match(page, /!isGovernanceOperationActive\(model.surface, "governance.accessPreview"\)/);
});
