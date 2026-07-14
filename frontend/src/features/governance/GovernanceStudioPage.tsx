import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { OwnerLayout } from "../../layouts/OwnerLayout";
import { OrganizationLayout } from "../../layouts/OrganizationLayout";
import { PageHeader, SectionCard, StateRegion, StatusPill, Tabs, type TabItem } from "../../shared/ui";
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

type GovernanceTabId = "overview" | "roles-permissions" | "taxonomy" | "groups" | "data-scopes" | "aliases-navigation" | "access-preview" | "audit-diagnostics" | "members";
const ownerGovernanceTabs: GovernanceTabId[] = ["overview", "roles-permissions", "taxonomy", "groups", "data-scopes", "aliases-navigation", "access-preview", "audit-diagnostics"];
const tenantGovernanceTabs: GovernanceTabId[] = ["roles-permissions", "members", "data-scopes", "taxonomy", "groups", "aliases-navigation", "access-preview"];
const moduleLabels: Record<GovernanceTabId, string> = { overview: "Overview", "roles-permissions": "Roles and permissions", members: "Members", taxonomy: "Organization taxonomy", groups: "Groups", "data-scopes": "Data-scope assignments", "aliases-navigation": "Aliases and navigation", "access-preview": "Access preview", "audit-diagnostics": "Audit and diagnostics" };
const tabModuleKey: Record<GovernanceTabId, GovernanceModuleKey> = { overview: "overview", "roles-permissions": "permissions", members: "members", taxonomy: "taxonomy", groups: "units", "data-scopes": "data-scope", "aliases-navigation": "aliases-navigation", "access-preview": "access-preview", "audit-diagnostics": "audit" };
const tabsForSurface = (surface: GovernanceSurface) => surface === "owner" ? ownerGovernanceTabs : tenantGovernanceTabs;
const buildOrganizationSurfacePath = (surface: GovernanceSurface, organizationId: string) => {
  if (!organizationId) return appRoutes.ownerOrganizations.path;
  return surface === "owner" ? appRoutes.ownerOrganizationState.build?.({ organizationId }) ?? appRoutes.ownerOrganizations.path : `/o/${encodeURIComponent(organizationId)}`;
};

const emptyGovernanceModel = (organizationId: string, surface: GovernanceSurface): GovernanceReadModel => ({
  organizationId,
  surface,
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

const GovernanceModules = ({ activeTab, model, previewOwnerAccess, previewTenantAccess, onSelectTab }: { activeTab: GovernanceTabId; model: GovernanceReadModel; previewOwnerAccess: ReturnType<typeof useGovernanceApi>["previewOwnerAccessReadOnly"]; previewTenantAccess: ReturnType<typeof useGovernanceApi>["previewTenantAccessReadOnly"]; onSelectTab: (tab: GovernanceTabId) => void }) => {
  const activeModule = tabModuleKey[activeTab];
  const previewModel = { ...model, previewOwnerAccess, previewTenantAccess };
  if (activeModule === "overview") return <OverviewModule model={model} onSelectTab={(tab) => onSelectTab(tab as GovernanceTabId)} />;
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
  const organizationId = params.organizationId ?? params.orgId ?? "";
  const governanceApi = useGovernanceApi();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as GovernanceTabId | null) ?? tabsForSurface(surface)[0];
  const [activeTab, setActiveTab] = useState<GovernanceTabId>(() => tabsForSurface(surface).includes(initialTab) ? initialTab : tabsForSurface(surface)[0]);
  const [model, setModel] = useState<GovernanceReadModel>(() => emptyGovernanceModel(organizationId, surface));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    if (!organizationId || !isGovernanceOperationActive(surface, "governance.readModel")) {
      setModel(emptyGovernanceModel(organizationId, surface));
      setError(!organizationId ? "Choose an organization from Directory to open its Governance tabs." : null);
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
  const tabs = tabsForSurface(surface);
  const selectTab = (tab: GovernanceTabId) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  const tabItems: TabItem<GovernanceTabId>[] = tabs.map((tab) => ({
    id: tab,
    label: moduleLabels[tab],
    status: <StatusPill status={moduleStatusTone(model, tabModuleKey[tab])} noDot>{moduleStatusLabel(model, tabModuleKey[tab])}</StatusPill>,
    panel: <GovernanceModules activeTab={tab} model={model} previewOwnerAccess={governanceApi.previewOwnerAccessReadOnly} previewTenantAccess={governanceApi.previewTenantAccessReadOnly} onSelectTab={selectTab} />,
  }));
  return (
    <Layout organizationId={organizationId} isAdmin={surface === "tenant"}>
      <PageHeader eyebrow="Governance" title={governanceDisplayName(organizationId)} description="Canonical Logto organization · governance snapshot for permissions, groups, data scopes, aliases and audit." actions={<><Link className="civitas-secondary-button" to={appRoutes.ownerOrganizations.path}>Back to Directory</Link><StatusPill status={model.versions.runtimeStatus === "current" ? "success" : "warning"}>{model.versions.runtimeStatus ?? "pending"}</StatusPill></>} />
      {error ? <SectionCard title="Select an organization" description={error}><Link className="civitas-secondary-button" to={appRoutes.ownerOrganizations.path}>Open Directory</Link></SectionCard> : null}
      {loading ? <StateRegion><p className="text-sm text-muted-strong">Preparing governance data...</p></StateRegion> : null}
      <Tabs items={tabItems} activeId={activeTab} onChange={selectTab} label="Governance modules" />
      <p className="text-xs text-muted">Need operational context? <Link className="text-primary-strong" to={buildOrganizationSurfacePath(surface, organizationId)}>Open organization surface</Link>.</p>
    </Layout>
  );
};
