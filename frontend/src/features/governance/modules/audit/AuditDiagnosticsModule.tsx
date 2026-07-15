import { DataTable, EmptyState, MetricCard, SectionCard, StatusPill, type DataTableColumn } from "../../../../shared/ui";
import type { GovernanceAuditEvent } from "../../contracts";

const safeJson = (value: unknown) => value === undefined ? "Not disclosed" : JSON.stringify(value, null, 2);
const columns: DataTableColumn<GovernanceAuditEvent>[] = [
  { key: "time", header: "Timestamp", render: (event) => event.createdAt || "Not reported" },
  { key: "actor", header: "Actor", render: (event) => event.actorId || "Unknown" },
  { key: "action", header: "Action", render: (event) => <span className="font-medium text-text">{event.action}</span> },
  { key: "target", header: "Target", render: (event) => event.target || event.targetId || "governance" },
  { key: "result", header: "Result", render: (event) => <StatusPill status={(event.result || event.reason).includes("denied") || (event.result || event.reason).includes("failed") ? "warning" : "success"}>{event.result || event.reason || "Recorded"}</StatusPill> },
  { key: "detail", header: "Disclosure", render: (event) => <details><summary className="cursor-pointer text-sm text-link">Redacted detail</summary><pre className="mt-2 max-w-md overflow-auto rounded-control bg-surface-subtle p-2 text-xs">{safeJson({ before: event.before, after: event.after, reason: event.reason, contractVersion: event.contractVersion })}</pre></details> },
];

export const AuditDiagnosticsModule = ({ events }: { events: readonly GovernanceAuditEvent[] }) => (
  <>
    <SectionCard title="Audit summary" description="A product summary of returned governance audit activity with redacted diagnostics.">
      <div className="civitas-grid-3">
        <MetricCard label="Events" value={events.length} detail="Returned in the current governance snapshot." />
        <MetricCard label="Latest event" value={events[0]?.action ?? "None"} detail={events[0]?.createdAt ?? "No event timestamp returned."} />
        <MetricCard label="Attention" value={events.filter((event) => (event.result || event.reason).includes("denied") || (event.result || event.reason).includes("failed")).length} detail="Denied or failed governance activity." />
      </div>
    </SectionCard>
    <SectionCard title="Audit events" description="Review actor, action, target, result and accessible before/after disclosure.">
      <DataTable columns={columns} data={[...events]} getKey={(event) => event.id} emptyState={<EmptyState message="No governance audit events"><p className="text-sm text-muted-strong">No audited governance activity was returned for the selected period.</p></EmptyState>} />
    </SectionCard>
  </>
);
