import type { ReactNode } from "react";
import { SectionCard } from "./SectionCard";

export const StateRegion = ({ children }: { children: ReactNode }) => (
  <SectionCard className="civitas-state-region" data-variant="state-region">
    <div className="civitas-stack-sm" aria-live="polite">
      {children}
    </div>
  </SectionCard>
);
