import type { ReactNode } from "react";

export const SplitView = ({ list, detail, label = "List and detail" }: { list: ReactNode; detail: ReactNode; label?: string }) => (
  <section className="civitas-split-view" aria-label={label} data-civitas-pattern="split-view">
    <div className="civitas-split-view-list">{list}</div>
    <aside className="civitas-split-view-detail">{detail}</aside>
  </section>
);
