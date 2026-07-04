import type { ReactNode } from "react";
import { SectionCard } from "./SectionCard";
import { ActionBar } from "./ActionBar";

export const PageHeader = ({ eyebrow, title, description, actions }: { eyebrow: string; title: ReactNode; description?: ReactNode; actions?: ReactNode }) => (
  <SectionCard className="civitas-page-header">
    <div className="civitas-page-header-inner">
      <div>
        <p className="civitas-eyebrow">{eyebrow}</p>
        <h1 className="civitas-page-title">{title}</h1>
        {description ? <p className="civitas-page-description">{description}</p> : null}
      </div>
      {actions ? <ActionBar>{actions}</ActionBar> : null}
    </div>
  </SectionCard>
);
