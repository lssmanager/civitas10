import { useEffect, useState } from "react";
import { OwnerBadge, OwnerShell, ownerToneFromSeverity } from "../components/owner/OwnerUI";
import { AlertStrip, EmptyState, KpiGrid, MetricCard, PageHeader, SectionCard, StatusPill } from "../shared/ui";
import { useOwnerApi, type WorkerHealthAggregate } from "../api/owner";

const OwnerWorkerQueuesPage = () => {
  const ownerApi = useOwnerApi();
  const [data, setData] = useState<WorkerHealthAggregate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setError(null);
      try {
        const response = await ownerApi.getWorkerQueuesObservability();
        if (!cancelled) setData(response);
      } catch (caught) {
        if (!cancelled) {
          console.error("Failed to load owner runtime observability", caught);
          setError("No se pudo cargar el estado operativo");
        }
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [ownerApi]);

  return (
    <OwnerShell>
      <PageHeader eyebrow="Runtime" title="Operational runtime console" description="Consola técnica owner para worker heartbeat, Redis signal, colas, backlog, failed jobs y organizaciones bloqueadas." />
      {error ? <AlertStrip variant="danger">{error}</AlertStrip> : null}
      <KpiGrid cols={3}>
        <MetricCard label="Worker" detail={data?.workerHealth.humanMessage || "Loading worker health..."}>{data ? <OwnerBadge tone={ownerToneFromSeverity(data.workerHealth.severity)}>{data.workerHealth.classification}</OwnerBadge> : <StatusPill status="unknown">loading</StatusPill>}</MetricCard>
        <MetricCard label="Queue incidents" value={data?.queues.filter((queue) => queue.classification !== "alive").length ?? 0} detail="Backlog and failed job signals across runtime queues." />
        <MetricCard label="Blocked organizations" value={data?.blockedOrganizations.length ?? 0} detail="Organizations affected by worker, queue or sync blockers." />
      </KpiGrid>
      <section className="civitas-grid-2">
        <SectionCard title="Queues">
          <div className="civitas-stack">
            {data?.queues.map((queue) => <SectionCard key={queue.name}><div className="civitas-page-header-inner"><h3 className="civitas-card-title">{queue.name}</h3><OwnerBadge tone={ownerToneFromSeverity(queue.severity)}>{queue.classification}</OwnerBadge></div><p className="civitas-muted">waiting {queue.waiting} · active {queue.active} · delayed {queue.delayed} · failed {queue.failed} · oldest {queue.oldestJobAgeSeconds}s</p></SectionCard>)}
            {data && data.queues.length === 0 ? <EmptyState message="No queues reported by runtime." /> : null}
          </div>
        </SectionCard>
        <SectionCard title="Blocked organizations">
          <div className="civitas-stack">
            {data?.blockedOrganizations.length ? data.blockedOrganizations.map((item, index) => <SectionCard key={String(item.logtoOrganizationId || index)}><div className="civitas-page-header-inner"><h3 className="civitas-card-title">{String(item.name || item.logtoOrganizationId || "Unknown organization")}</h3><OwnerBadge tone={ownerToneFromSeverity(String(item.severity))}>{String(item.blocker || item.status)}</OwnerBadge></div><p className="civitas-muted">{String(item.humanMessage || "Operational blocker detected.")}</p></SectionCard>) : <EmptyState message="No blocked organizations detected." />}
          </div>
        </SectionCard>
      </section>
    </OwnerShell>
  );
};

export default OwnerWorkerQueuesPage;
