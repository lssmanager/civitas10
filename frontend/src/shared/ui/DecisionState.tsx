import type { ReactNode } from "react";
import { StatusPill, type StatusPillStatus } from "./StatusPill";

export type DecisionStateKind = "allowed" | "denied" | "limited" | "pending" | "unavailable";

const statusByKind: Record<DecisionStateKind, StatusPillStatus> = { allowed: "success", denied: "danger", limited: "warning", pending: "neutral", unavailable: "warning" };

export const DecisionState = ({ kind, title, reasonCode, children }: { kind: DecisionStateKind; title: ReactNode; reasonCode?: string; children?: ReactNode }) => (
  <section className="civitas-card civitas-decision-state" data-civitas-primitive="decision-state" aria-live={kind === "pending" ? "polite" : undefined}>
    <div className="civitas-card-header">
      <div>
        <p className="civitas-eyebrow">Decision</p>
        <h2 className="civitas-card-title">{title}</h2>
      </div>
      <StatusPill status={statusByKind[kind]}>{kind}</StatusPill>
    </div>
    {reasonCode ? <p className="text-sm text-muted-strong">Reason: <code>{reasonCode}</code></p> : null}
    {children}
  </section>
);
