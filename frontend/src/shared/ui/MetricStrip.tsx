import type { ReactNode } from "react";

export type MetricStripItem = { label: string; value: ReactNode; detail?: ReactNode };

export const MetricStrip = ({ metrics }: { metrics: MetricStripItem[] }) => (
  <dl className="civitas-metric-strip" data-civitas-primitive="metric-strip">
    {metrics.map((metric) => <div key={metric.label} className="civitas-metric-strip-item"><dt>{metric.label}</dt><dd>{metric.value}</dd>{metric.detail ? <p>{metric.detail}</p> : null}</div>)}
  </dl>
);
