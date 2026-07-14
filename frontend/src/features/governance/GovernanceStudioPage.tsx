import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { OwnerLayout } from "../../layouts/OwnerLayout";
import { OrganizationLayout } from "../../layouts/OrganizationLayout";
import { PageHeader, SectionCard, StatusPill } from "../../shared/ui";
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
import { AccessPreviewModule } from "./modules/access-preview/AccessPreviewModule";
import { AuditDiagnosticsModule } from "./modules/audit/AuditDiagnosticsModule";

const ownerGovernanceTabs: GovernanceModuleKey[] = ["overview", "permissions", "taxonomy", "units", "data-scope", "aliases-navigation", "access-preview", "audit"];
const tenantGovernanceTabs: GovernanceModuleKey[] = ["permissions", "members", "data-scope", "taxonomy", "units", "aliases-navigation", "access-preview"];
const moduleLabels: Record<GovernanceModuleKey, string> = { overview: "Overview and drift status", permissions: "Roles and permission ceilings", members: "Members and role assignments", taxonomy: "Organization taxonomy", units: "Units and groups", "data-scope": "Data-scope assignments", "aliases-navigation": "Aliases and navigation", "access-preview": "Access preview", audit: "Audit and diagnostics" };
const tenantModuleLabels: Partial<Record<GovernanceModuleKey, string>> = { permissions: "Active permissions", "data-scope": "Data assignments" };
const tabsForSurface = (surface: GovernanceSurface) => surface === "owner" ? ownerGovernanceTabs : tenantGovernanceTabs;
const buildGovernancePath = (surface: GovernanceSurface, organizationId: string) => {
  if (!organizationId) return surface === "owner" ? appRoutes.ownerGovernance.path : "";
  return surface === "owner" ? appRoutes.ownerOrganizationGovernance.build?.({ organizationId }) ?? appRoutes.ownerGovernance.path : appRoutes.tenantGovernance.build?.({ organizationId }) ?? "";
};
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
  diagnostics: ["read-model-pending", "backend-remains-authority"],
});

const GovernanceModules = ({ activeModule, model, previewOwnerAccess, previewTenantAccess }: { activeModule: GovernanceModuleKey; model: GovernanceReadModel; previewOwnerAccess: ReturnType<typeof useGovernanceApi>["previewOwnerAccessReadOnly"]; previewTenantAccess: ReturnType<typeof useGovernanceApi>["previewTenantAccessReadOnly"] }) => {
  const previewModel = { ...model, previewOwnerAccess, previewTenantAccess };
  if (activeModule === "overview") return <OverviewModule model={model} />;
  if (activeModule === "permissions") return <PermissionMatrixModule rows={model.permissionMatrix} surface={model.surface} />;
  if (activeModule === "members") return <MembersRoleAssignmentsModule />;
  if (activeModule === "taxonomy") return <TaxonomyModule items={model.taxonomy} />;
  if (activeModule === "units") return <UnitsModule units={model.units} />;
  if (activeModule === "data-scope") return <DataScopeModule assignments={model.dataScopes} />;
  if (activeModule === "aliases-navigation") return <AliasesNavigationModule policy={model.aliasesNavigation} />;
  if (activeModule === "access-preview") {
    if (!isGovernanceOperationActive(model.surface, "governance.accessPreview")) return <SectionCard title="Access preview unavailable" description="No active backend access-preview operation is mounted for this governance surface yet."><p className="text-sm text-muted-strong">The UI stays read-only and does not fetch an endpoint until the operation registry marks it active.</p></SectionCard>;
    return <AccessPreviewModule organizationId={model.organizationId} surface={model.surface} previews={model.accessPreviews} onPreview={previewModel.surface === "owner" ? previewOwnerAccess : previewTenantAccess} />;
  }
  return <AuditDiagnosticsModule events={model.auditEvents} />;
};

export const GovernanceStudioPage = ({ surface }: { surface: GovernanceSurface }) => {
  const params = useParams();
  const organizationId = params.organizationId ?? params.orgId ?? "";
  const governanceApi = useGovernanceApi();
  const [activeModule, setActiveModule] = useState<GovernanceModuleKey>(() => tabsForSurface(surface)[0]);
  const [model, setModel] = useState<GovernanceReadModel>(() => emptyGovernanceModel(organizationId, surface));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    if (!organizationId || !isGovernanceOperationActive(surface, "governance.readModel")) {
      setModel(emptyGovernanceModel(organizationId, surface));
      setError(!organizationId ? "Governance requires a selected organization." : null);
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
  const title = surface === "owner" ? "Authorization Governance Studio" : "Organization Governance Studio";
  const tabs = tabsForSurface(surface);
  const routeContext = useMemo(() => buildGovernancePath(surface, organizationId), [organizationId, surface]);

  return (
    <Layout organizationId={organizationId} isAdmin={surface === "tenant"}>
      <PageHeader eyebrow={surface === "owner" ? "Owner governance" : "Tenant governance"} title={title} description="Composes permissions, owner ceilings, tenant activations, data scope, taxonomy, units, aliases and visual navigation without becoming a new authorization authority." actions={<StatusPill status={model.versions.runtimeStatus === "current" ? "success" : "warning"}>{model.versions.runtimeStatus ?? "pending"}</StatusPill>} />
      <SectionCard title="Governance boundary" description="Feature writes stay in their owning services (#94/#95/#97/#98/#76/#77). This page consumes the aggregate read model and preview endpoints only.">
        <div className="flex flex-wrap gap-2 text-sm"><StatusPill status="neutral">{routeContext}</StatusPill><StatusPill status="neutral">no wildcards</StatusPill><StatusPill status="neutral">no client Logto Management API</StatusPill><StatusPill status="neutral">visual preferences only subtract</StatusPill></div>
        {error ? <p className="mt-3 text-sm text-warning-strong">{error}</p> : null}
        {loading ? <p className="mt-3 text-sm text-muted-strong">Loading governance read model...</p> : null}
      </SectionCard>
      <nav className="civitas-card civitas-pad-tight" aria-label="Governance modules" data-governance-studio-tabs="true">
        <div className="flex flex-wrap gap-2">
          {tabs.map((key) => <button key={key} type="button" className={activeModule === key ? "civitas-primary-button" : "civitas-secondary-button"} aria-pressed={activeModule === key} onClick={() => setActiveModule(key)}>{surface === "tenant" ? tenantModuleLabels[key] ?? moduleLabels[key] : moduleLabels[key]}</button>)}
        </div>
      </nav>
      <GovernanceModules activeModule={activeModule} model={model} previewOwnerAccess={governanceApi.previewOwnerAccessReadOnly} previewTenantAccess={governanceApi.previewTenantAccessReadOnly} />
      <p className="text-xs text-muted">Need operational context? <Link className="text-primary-strong" to={buildOrganizationSurfacePath(surface, organizationId)}>Open organization surface</Link>.</p>
    </Layout>
  );
};
