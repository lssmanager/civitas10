import type { ReactNode } from "react";
import { SectionCard } from "./SectionCard";

export const MetricCard = ({ label, value, detail, children, variant = "neutral" }: { label: string; value?: ReactNode; detail?: ReactNode; children?: ReactNode; variant?: "ok" | "danger" | "warning" | "neutral" }) => (
  <SectionCard className="civitas-metric-card" data-variant={variant}>
    <p className="civitas-metric-label">{label}</p>
    {value !== undefined ? <div className="civitas-metric-value">{value}</div> : null}
    {children ? <div className="civitas-metric-content">{children}</div> : null}
    {detail ? <p className="civitas-muted civitas-metric-detail">{detail}</p> : null}
  </SectionCard>
);
