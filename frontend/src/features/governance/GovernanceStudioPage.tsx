import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { OwnerLayout } from "../../layouts/OwnerLayout";
import { OrganizationLayout } from "../../layouts/OrganizationLayout";
import { PageHeader, SectionCard, SectionNavigation, StateRegion, StatusPill, type SectionNavigationItem } from "../../shared/ui";
import { useGovernanceApi } from "./api";
import { appRoutes } from "../../navigation/routes";
import { governanceModuleStatus, isGovernanceOperationActive } from "./governance-capabilities";
import type { GovernanceModuleKey, GovernanceReadModel, GovernanceSurface } from "./contracts";
import { OverviewModule } from "./modules/overview/OverviewModule";
import { PermissionMatrixModule } from "./modules/permission-matrix/PermissionMatrixModule";
import { TaxonomyModule } from "./modules/taxonomy/TaxonomyModule";
import { MembersRoleAssignmentsModule } from "./modules/members/MembersRoleAssignmentsModule";
import { UnitsModule } from "./modules/units/UnitsModule";
import { DataScopeModule } from "./modules/data-scope/DataScopeModule";
import { AliasesNavigationModule } from "./modules/aliases-navigation/AliasesNavigationModule";
import { AccessPreviewModule, AccessPreviewUnavailable } from "./modules/access-preview/AccessPreviewModule";
import { AuditDiagnosticsModule } from "./modules/audit/AuditDiagnosticsModule";
import { governanceDisplayName, moduleStatusLabel, moduleStatusTone } from "./adapters/governance-view-model";

type GovernanceSectionId = "overview" | "roles" | "taxonomy" | "groups" | "data-scopes" | "navigation" | "preview" | "audit" | "members";
type GovernanceTabId = "overview" | "roles-permissions" | "taxonomy" | "groups" | "data-scopes" | "aliases-navigation" | "access-preview" | "audit-diagnostics" | "members";
const ownerGovernanceSections: GovernanceSectionId[] = ["overview", "roles", "taxonomy", "groups", "data-scopes", "navigation", "preview", "audit"];
const tenantGovernanceSections: GovernanceSectionId[] = ["roles", "members", "data-scopes", "taxonomy", "groups", "navigation", "preview"];
const sectionLabels: Record<GovernanceSectionId, string> = { overview: "Overview", roles: "Roles and permissions", members: "Members", taxonomy: "Taxonomy", groups: "Groups", "data-scopes": "Data scopes", navigation: "Aliases and navigation", preview: "Access preview", audit: "Audit and diagnostics" };
const sectionToModuleKey: Record<GovernanceSectionId, GovernanceModuleKey> = { overview: "overview", roles: "permissions", members: "members", taxonomy: "taxonomy", groups: "units", "data-scopes": "data-scope", navigation: "aliases-navigation", preview: "access-preview", audit: "audit" };
const sectionToTab: Record<GovernanceSectionId, GovernanceTabId> = { overview: "overview", roles: "roles-permissions", members: "members", taxonomy: "taxonomy", groups: "groups", "data-scopes": "data-scopes", navigation: "aliases-navigation", preview: "access-preview", audit: "audit-diagnostics" };
const tabToSection: Record<GovernanceTabId, GovernanceSectionId> = { overview: "overview", "roles-permissions": "roles", members: "members", taxonomy: "taxonomy", groups: "groups", "data-scopes": "data-scopes", "aliases-navigation": "navigation", "access-preview": "preview", "audit-diagnostics": "audit" };
const sectionsForSurface = (surface: GovernanceSurface) => surface === "owner" ? ownerGovernanceSections : tenantGovernanceSections;
const buildOrganizationSurfacePath = (surface: GovernanceSurface, organizationId: string) => {
  if (!organizationId) return appRoutes.ownerOrganizations.path;
  return surface === "owner" ? appRoutes.ownerOrganizationState.build?.({ organizationId }) ?? appRoutes.ownerOrganizations.path : `/o/${encodeURIComponent(organizationId)}`;
};

const ownerSectionRoute: Record<Exclude<GovernanceSectionId, "members">, keyof typeof appRoutes> = {
  overview: "ownerOrganizationGovernance",
  roles: "ownerOrganizationGovernanceRoles",
  taxonomy: "ownerOrganizationGovernanceTaxonomy",
  groups: "ownerOrganizationGovernanceGroups",
  "data-scopes": "ownerOrganizationGovernanceDataScopes",
  navigation: "ownerOrganizationGovernanceNavigation",
  preview: "ownerOrganizationGovernancePreview",
  audit: "ownerOrganizationGovernanceAudit",
};

const sectionPath = (surface: GovernanceSurface, organizationId: string, section: GovernanceSectionId) => {
  if (surface === "owner" && section !== "members") return appRoutes[ownerSectionRoute[section]].build?.({ organizationId }) ?? appRoutes.ownerOrganizations.path;
  const tab = sectionToTab[section];
  return `${appRoutes.tenantGovernance.build?.({ organizationId }) ?? `/o/${encodeURIComponent(organizationId)}/settings/governance`}?tab=${encodeURIComponent(tab)}`;
};

const activeSectionFromLocation = (surface: GovernanceSurface, pathname: string, search: string): GovernanceSectionId => {
  if (surface === "tenant") {
    const tab = new URLSearchParams(search).get("tab") as GovernanceTabId | null;
    return tab && tabToSection[tab] ? tabToSection[tab] : sectionsForSurface(surface)[0];
  }
  const pathParts = pathname.split("/").filter(Boolean);
  const last = pathParts[pathParts.length - 1] || "governance";
  if (last === "governance") return "overview";
  if (["roles", "taxonomy", "groups", "data-scopes", "navigation", "preview", "audit"].includes(last)) return last as GovernanceSectionId;
  return "overview";
};

const emptyGovernanceModel = (organizationId: string, surface: GovernanceSurface): GovernanceReadModel => ({
  organizationId,
  surface,
  organizationName: null,
  versions: { catalogVersion: "unavailable", runtimeStatus: "pending" },
  modules: governanceModuleStatus(surface),
  permissionMatrix: [],
  taxonomy: [],
  units: [],
  dataScopes: [],
  aliasesNavigation: { aliasesTenantEditable: false, navigationTenantEditable: false, visualPreferences: [] },
  accessPreviews: [],
  auditEvents: [],
  diagnostics: ["read-model-pending"],
});

const GovernanceModules = ({ activeSection, model, previewOwnerAccess, previewTenantAccess, onSelectSection }: { activeSection: GovernanceSectionId; model: GovernanceReadModel; previewOwnerAccess: ReturnType<typeof useGovernanceApi>["previewOwnerAccessReadOnly"]; previewTenantAccess: ReturnType<typeof useGovernanceApi>["previewTenantAccessReadOnly"]; onSelectSection: (section: GovernanceSectionId) => void }) => {
  const activeModule = sectionToModuleKey[activeSection];
  const previewModel = { ...model, previewOwnerAccess, previewTenantAccess };
  if (activeModule === "overview") return <OverviewModule model={model} onSelectTab={(tab) => onSelectSection(tabToSection[tab as GovernanceTabId] ?? "overview")} />;
  if (activeModule === "permissions") return <PermissionMatrixModule rows={model.permissionMatrix} surface={model.surface} />;
  if (activeModule === "members") return <MembersRoleAssignmentsModule />;
  if (activeModule === "taxonomy") return <TaxonomyModule items={model.taxonomy} />;
  if (activeModule === "units") return <UnitsModule units={model.units} />;
  if (activeModule === "data-scope") return <DataScopeModule assignments={model.dataScopes} />;
  if (activeModule === "aliases-navigation") return <AliasesNavigationModule policy={model.aliasesNavigation} />;
  if (activeModule === "access-preview") {
    if (!isGovernanceOperationActive(model.surface, "governance.accessPreview")) return <AccessPreviewUnavailable />;
    return <AccessPreviewModule organizationId={model.organizationId} surface={model.surface} previews={model.accessPreviews} onPreview={previewModel.surface === "owner" ? previewOwnerAccess : previewTenantAccess} />;
  }
  return <AuditDiagnosticsModule events={model.auditEvents} />;
};

export const GovernanceStudioPage = ({ surface }: { surface: GovernanceSurface }) => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const organizationId = params.organizationId ?? params.orgId ?? "";
  const governanceApi = useGovernanceApi();
  const activeSection = activeSectionFromLocation(surface, location.pathname, location.search);
  const [model, setModel] = useState<GovernanceReadModel>(() => emptyGovernanceModel(organizationId, surface));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    if (!organizationId || !isGovernanceOperationActive(surface, "governance.readModel")) {
      setModel(emptyGovernanceModel(organizationId, surface));
      setError(!organizationId ? "Choose an organization from Directory to open its Governance sections." : null);
      setLoading(false);
      return () => { active = false; };
    }
    const load = surface === "owner" ? governanceApi.getOwnerGovernance : governanceApi.getTenantGovernance;
    void load(organizationId)
      .then((response) => { if (active) setModel(response); })
      .catch((caught) => { if (active) { setError(caught instanceof Error ? caught.message : "Governance read model unavailable."); setModel(emptyGovernanceModel(organizationId, surface)); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [governanceApi, organizationId, surface]);

  const Layout = surface === "owner" ? OwnerLayout : OrganizationLayout;
  const displayName = governanceDisplayName(model, organizationId);
  const sectionItems: SectionNavigationItem[] = useMemo(() => sectionsForSurface(surface).map((section) => {
    const key = sectionToModuleKey[section];
    return { id: section, label: sectionLabels[section], href: sectionPath(surface, organizationId, section), status: moduleStatusLabel(model, key), statusTone: moduleStatusTone(model, key) };
  }), [model, organizationId, surface]);
  const selectSection = (section: GovernanceSectionId) => navigate(sectionPath(surface, organizationId, section));

  return (
    <Layout organizationId={organizationId} isAdmin={surface === "tenant"}>
      <PageHeader eyebrow="Organizations / Governance" title={displayName} description="Governance overview for catalog health, permissions, groups, data scopes, aliases and audit." actions={<><Link className="civitas-secondary-button" to={appRoutes.ownerOrganizations.path}>Back to Directory</Link><StatusPill status={model.versions.runtimeStatus === "current" ? "success" : "warning"}>{model.versions.runtimeStatus ?? "pending"}</StatusPill></>} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted-strong"><Link to={appRoutes.ownerOrganizations.path} className="text-primary-strong">Organizations</Link> / <span>{displayName}</span> / <span>Governance</span> / <span>{sectionLabels[activeSection]}</span></nav>
      {error ? <SectionCard title="Select an organization" description={error}><Link className="civitas-secondary-button" to={appRoutes.ownerOrganizations.path}>Open Directory</Link></SectionCard> : null}
      {loading ? <StateRegion><p className="text-sm text-muted-strong">Preparing governance data...</p></StateRegion> : null}
      <div className="grid gap-4 md:grid-cols-[16rem_minmax(0,1fr)]">
        <SectionNavigation label="Governance" items={sectionItems} activeId={activeSection} />
        <section className="min-w-0" aria-labelledby="governance-section-title">
          <h2 id="governance-section-title" className="sr-only">{sectionLabels[activeSection]}</h2>
          <GovernanceModules activeSection={activeSection} model={model} previewOwnerAccess={governanceApi.previewOwnerAccessReadOnly} previewTenantAccess={governanceApi.previewTenantAccessReadOnly} onSelectSection={selectSection} />
        </section>
      </div>
      <p className="text-xs text-muted">Need operational context? <Link className="text-primary-strong" to={buildOrganizationSurfacePath(surface, organizationId)}>Open organization surface</Link>.</p>
    </Layout>
  );
};
