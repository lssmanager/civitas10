import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { OwnerBadge, OwnerShell, ownerToneFromSeverity } from "../components/owner/OwnerUI";
import { AlertStrip, DataTable, EmptyState, KpiGrid, MetricCard, PageHeader, SectionCard, StatusPill, type DataTableColumn } from "../shared/ui";
import { useOwnerApi, type OwnerOrganization, type WorkerHealthAggregate } from "../api/owner";
import { appRoutes } from "../navigation/routes";

const OwnerOperationalHomePage = () => {
  const ownerApi = useOwnerApi();
  const [organizations, setOrganizations] = useState<OwnerOrganization[]>([]);
  const [runtime, setRuntime] = useState<WorkerHealthAggregate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [orgResponse, runtimeResponse] = await Promise.all([
          ownerApi.getOrganizations(),
          ownerApi.getWorkerQueuesObservability(),
        ]);
        if (cancelled) return;
        setOrganizations(orgResponse.organizations || []);
        setRuntime(runtimeResponse);
      } catch (caught) {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : "Failed to load owner operational overview.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [ownerApi]);

  const columns: DataTableColumn<OwnerOrganization>[] = [
    { key: "organization", header: "Organization", render: (organization) => <strong>{organization.name || "Unnamed organization"}</strong> },
    { key: "logto", header: "Logto org id", render: (organization) => organization.logtoOrganizationId || "-" },
    { key: "profile", header: "Profile signal", render: (organization) => {
      const profile = (organization.profile || {}) as Record<string, unknown>;
      const profileSignal = Object.keys(profile).length > 0 ? "profile present" : "needs review";
      return <OwnerBadge tone={profileSignal === "profile present" ? "success" : "warning"}>{profileSignal}</OwnerBadge>;
    } },
    { key: "action", header: "Action", render: (organization) => organization.logtoOrganizationId ? <Link to={`/owner/organizations/${encodeURIComponent(organization.logtoOrganizationId)}`} className="civitas-nav-link">Open organization</Link> : <span className="civitas-muted">Unavailable</span> },
  ];

  return (
    <OwnerShell>
      <PageHeader eyebrow="Owner overview" title="Global owner summary" description="Resumen ejecutivo del estado global: organizaciones, señales críticas y accesos profundos a vistas especializadas. El detalle técnico vive en Runtime y la creación vive en Create." />

      {error ? <AlertStrip variant="danger">{error}</AlertStrip> : null}

      <KpiGrid cols={3}>
        <MetricCard label="Organizations" value={loading ? "..." : organizations.length} variant={loading ? "neutral" : "ok"} />
        <MetricCard label="Runtime status" detail={runtime?.workerHealth.humanMessage || "Runtime status not loaded yet."}>
          {runtime ? <OwnerBadge tone={ownerToneFromSeverity(runtime.workerHealth.severity)}>{runtime.workerHealth.classification}</OwnerBadge> : <StatusPill status="unknown">loading</StatusPill>}
        </MetricCard>
        <MetricCard label="Blocked organizations" value={runtime?.blockedOrganizations.length ?? 0} variant={(runtime?.blockedOrganizations.length ?? 0) > 0 ? "danger" : "ok"}>
          <Link to={appRoutes.ownerWorkerQueues.path} className="civitas-nav-link">View operational issues</Link>
        </MetricCard>
      </KpiGrid>

      <SectionCard title="Organizations" description="Resumen de organizaciones canónicas disponibles para revisión owner." icon="◫" actions={<StatusPill status="live" noDot>live</StatusPill>} body="flush">
        <DataTable columns={columns} data={organizations} getKey={(organization, index) => organization.logtoOrganizationId || organization.name || String(index)} emptyState={!loading ? <EmptyState message="No organizations found." /> : undefined} />
      </SectionCard>
    </OwnerShell>
  );
};

export default OwnerOperationalHomePage;
