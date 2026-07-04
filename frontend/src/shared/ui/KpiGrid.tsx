import type { ReactNode } from "react";

export const KpiGrid = ({ children, cols = 3 }: { children: ReactNode; cols?: 2 | 3 | 4 }) => (
  <section className="civitas-kpi-grid" data-cols={cols}>{children}</section>
);
