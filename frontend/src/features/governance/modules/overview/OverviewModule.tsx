import { SectionCard, StatusPill } from "../../../../shared/ui";
import type { GovernanceReadModel } from "../../contracts";

export const OverviewModule = ({ model }: { model: GovernanceReadModel }) => (
  <SectionCard title="Overview" description="Read-only aggregate from the owning authorization contracts; no Logto template mutation happens here.">
    <div className="civitas-grid-3">
      {Object.entries(model.versions).map(([key, value]) => <div key={key} className="civitas-metric-card"><span className="civitas-metric-label">{key}</span><strong className="civitas-metric-value">{String(value || "-")}</strong></div>)}
    </div>
    <div className="mt-4 flex flex-wrap gap-2">{model.diagnostics.map((diagnostic) => <StatusPill key={diagnostic} status={diagnostic.includes("drift") ? "warning" : "neutral"}>{diagnostic}</StatusPill>)}</div>
  </SectionCard>
);
