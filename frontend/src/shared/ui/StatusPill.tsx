import type { ReactNode } from "react";

export type StatusPillStatus = "live" | "ok" | "success" | "warning" | "danger" | "critical" | "unknown" | "neutral";

export const StatusPill = ({ status = "neutral", children, noDot = false }: { status?: StatusPillStatus; children?: ReactNode; noDot?: boolean }) => (
  <span className="civitas-pill" data-status={status}>
    {noDot ? null : <span className="civitas-pill-dot" aria-hidden="true" />}
    {children ?? status}
  </span>
);
