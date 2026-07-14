import { DataTable, EmptyState, MetricCard, SectionCard, StatusPill, type DataTableColumn } from "../../../../shared/ui";
import type { GovernanceAuditEvent } from "../../contracts";

const columns: DataTableColumn<GovernanceAuditEvent>[] = [
  { key: "time", header: "Timestamp", render: (event) => event.createdAt || "Not reported" },
  { key: "actor", header: "Actor", render: (event) => event.actorId || "Unknown" },
  { key: "action", header: "Action", render: (event) => <span className="font-medium text-text">{event.action}</span> },
  { key: "target", header: "Target", render: (event) => event.target },
  { key: "result", header: "Result", render: (event) => <StatusPill status={event.reason.includes("denied") || event.reason.includes("failed") ? "warning" : "success"}>{event.reason || "Recorded"}</StatusPill> },
  { key: "version", header: "Version", render: (event) => <span className="text-xs text-muted">{event.contractVersion}</span> },
];

export const AuditDiagnosticsModule = ({ events }: { events: readonly GovernanceAuditEvent[] }) => (
  <>
    <SectionCard title="Audit summary" description="A product summary of returned governance audit activity.">
      <div className="civitas-grid-3">
        <MetricCard label="Events" value={events.length} detail="Returned in the current governance snapshot." />
        <MetricCard label="Latest event" value={events[0]?.action ?? "None"} detail={events[0]?.createdAt ?? "No event timestamp returned."} />
        <MetricCard label="Attention" value={events.filter((event) => event.reason.includes("denied") || event.reason.includes("failed")).length} detail="Denied or failed governance activity." />
      </div>
    </SectionCard>
    <SectionCard title="Audit events" description="Review actor, action, target, result and contract version for returned events.">
      <DataTable columns={columns} data={[...events]} getKey={(event) => event.id} emptyState={<EmptyState message="No governance audit events"><p className="text-sm text-muted-strong">No audited governance activity was returned for the selected period.</p></EmptyState>} />
    </SectionCard>
  </>
);
