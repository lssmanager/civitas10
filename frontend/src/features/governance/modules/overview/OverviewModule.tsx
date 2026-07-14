import { EmptyState, MetricCard, SectionCard, StatusPill } from "../../../../shared/ui";
import type { GovernanceReadModel } from "../../contracts";
import { configurationCoverage, governanceOverviewMetrics } from "../../adapters/governance-view-model";

export const OverviewModule = ({ model, onSelectTab }: { model: GovernanceReadModel; onSelectTab?: (tab: string) => void }) => {
  const attentionItems = Object.entries(model.modules).filter(([, module]) => module?.status === "pending" || module?.status === "blocked");
  return (
    <>
      <SectionCard title="Governance health" description="A product summary of the current governance snapshot for this organization.">
        <div className="civitas-grid-3">
          {governanceOverviewMetrics(model).map((metric) => <MetricCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} variant={metric.tone === "danger" ? "danger" : metric.tone === "warning" ? "warning" : metric.tone === "success" ? "ok" : "neutral"} />)}
        </div>
      </SectionCard>
      <SectionCard title="Attention required" description="Pending or unavailable areas that may need follow-up before the studio is complete.">
        {attentionItems.length ? <div className="flex flex-wrap gap-2">{attentionItems.map(([key, module]) => <StatusPill key={key} status={module?.status === "blocked" ? "danger" : "warning"}>{key.replace(/-/g, " ")}: {module?.status === "blocked" ? "Unavailable" : "Pending"}</StatusPill>)}</div> : <EmptyState message="No governance attention items were reported for this organization." />}
      </SectionCard>
      <SectionCard title="Configuration coverage" description="Use these summaries to jump to the tab that owns each governance area.">
        <div className="civitas-grid-3">
          {configurationCoverage(model).map((item) => (
            <button key={item.label} type="button" className="civitas-card civitas-pad-tight civitas-clickable-card text-left" onClick={() => onSelectTab?.(item.tab)}>
              <span className="civitas-metric-label">{item.label}</span>
              <strong className="civitas-metric-value">{item.count}</strong>
              <span className="text-sm text-muted-strong">Open {item.label.toLowerCase()}</span>
            </button>
          ))}
        </div>
      </SectionCard>
    </>
  );
};
