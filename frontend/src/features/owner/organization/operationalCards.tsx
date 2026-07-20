import { MetricCard, OwnerBadge, ownerToneFromSeverity } from "../../../components/owner/OwnerUI";
import type { ConsolidatedOperationalResponse, OperationalBlock, OwnerCapabilityState } from "../../../contracts/operational";

const actionLabel: Record<string, string> = {
  retry: "Retry",
  verify_provider: "Verify provider",
  open_organization: "Open organization",
  wait_first_wordpress_login: "Wait first WordPress login",
  manual_retry_required: "Manual retry required",
  human_action_required: "Human action required",
  none: "No action",
};

export const isInvalidOrganizationId = (value: string | undefined) => {
  const id = value ? value.trim() : "";
  if (!id) return true;
  const decoded = (() => {
    try {
      return decodeURIComponent(id);
    } catch {
      return id;
    }
  })();
  return decoded === `:${"organizationId"}`;
};

export function BlockCard({ title, block }: { title: string; block: OperationalBlock }) {
  return (
    <article className="owner-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{title}</p>
          <h3 className="mt-2 text-lg font-semibold text-text">{block.humanMessage || block.status}</h3>
        </div>
        <OwnerBadge tone={ownerToneFromSeverity(block.severity)}>{block.severity}</OwnerBadge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <OwnerBadge tone={ownerToneFromSeverity(block.status === "ok" || block.status === "healthy" ? "success" : block.severity)}>{block.status}</OwnerBadge>
        <span className="inline-flex rounded-full bg-neutral-soft px-2.5 py-1 text-xs font-medium text-muted-strong">{block.freshness.source}</span>
      </div>
      <dl className="mt-5 grid gap-3 text-sm text-muted-strong sm:grid-cols-2">
        <div><dt className="font-medium text-text">Provider code</dt><dd className="mt-1 break-all">{block.providerCode || "-"}</dd></div>
        <div><dt className="font-medium text-text">Provider status</dt><dd className="mt-1 break-all">{String(block.providerStatus || "-")}</dd></div>
        <div><dt className="font-medium text-text">Checked at</dt><dd className="mt-1">{block.freshness.checkedAt || "-"}</dd></div>
        <div><dt className="font-medium text-text">Next action</dt><dd className="mt-1">{actionLabel[String(block.nextAction)] || String(block.nextAction)}</dd></div>
      </dl>
    </article>
  );
}

export function CapabilityCard({ capability }: { capability: OwnerCapabilityState }) {
  const blockers = capability.blockers.length;
  return (
    <article className="owner-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{capability.capability}</p>
          <h3 className="mt-2 text-lg font-semibold text-text">{capability.label}</h3>
          <p className="mt-2 text-sm text-muted-strong">{capability.health.humanMessage || (capability.configured ? "Capability configured." : "Capability not configured.")}</p>
        </div>
        <OwnerBadge tone={ownerToneFromSeverity(capability.health.severity || (capability.configured ? "success" : "info"))}>{capability.health.status}</OwnerBadge>
      </div>
      <dl className="mt-5 grid gap-3 text-sm text-muted-strong sm:grid-cols-2">
        <div><dt className="font-medium text-text">Adapter</dt><dd className="mt-1">{capability.adapter?.label || "Not configured"}</dd></div>
        <div><dt className="font-medium text-text">Runtime source</dt><dd className="mt-1">{capability.runtimeState.source}</dd></div>
        <div><dt className="font-medium text-text">Blockers</dt><dd className="mt-1">{blockers}</dd></div>
        <div><dt className="font-medium text-text">Next actions</dt><dd className="mt-1">{capability.nextActions.length}</dd></div>
      </dl>
    </article>
  );
}

export const OperationalOverview = ({ organization }: { organization: ConsolidatedOperationalResponse }) => (
  <section className="grid gap-4 md:grid-cols-3">
    <MetricCard label="Summary" detail={organization.summary.humanMessage || "Capability surface loaded."}>
      <OwnerBadge tone={ownerToneFromSeverity(organization.summary.severity || "info")}>{organization.summary.status || "available"}</OwnerBadge>
    </MetricCard>
    <MetricCard label="Capabilities" value={organization.capabilities.length} detail="Owner capability surface returned by the backend contract." />
    <MetricCard label="Blockers" value={organization.blockers.length} detail="Aggregated capability blockers." />
  </section>
);

export const OperationalModules = ({ organization }: { organization: ConsolidatedOperationalResponse }) => (
  <>
    <section id="operations" className="grid gap-4 md:grid-cols-4">
      <MetricCard label="Summary" detail={organization.summary.humanMessage || "Capability surface loaded."}>
        <OwnerBadge tone={ownerToneFromSeverity(organization.summary.severity || "info")}>{organization.summary.status || "available"}</OwnerBadge>
      </MetricCard>
      <MetricCard label="Capabilities" value={organization.capabilities.length} detail="Owner capability surface returned by the backend contract." />
      <MetricCard label="Blockers" value={organization.blockers.length} detail="Aggregated capability blockers." />
      <MetricCard label="Polling" value={organization.polling.shouldPoll ? `${organization.polling.intervalSeconds}s` : "stopped"} detail={organization.polling.reason || "-"} />
    </section>
    <section className="grid gap-4 lg:grid-cols-2">
      {organization.capabilities.map((capability) => <CapabilityCard key={capability.capability} capability={capability} />)}
      {organization.worker ? <BlockCard title="Worker" block={organization.worker} /> : null}
    </section>
  </>
);
