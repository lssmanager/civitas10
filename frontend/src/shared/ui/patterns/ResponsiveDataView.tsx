import type { ReactNode } from "react";

export const ResponsiveDataView = ({ table, cards, label = "Data view" }: { table: ReactNode; cards: ReactNode; label?: string }) => (
  <section aria-label={label} data-civitas-pattern="responsive-data-view">
    <div className="hidden md:block">{table}</div>
    <div className="md:hidden civitas-workspace-stack">{cards}</div>
  </section>
);
