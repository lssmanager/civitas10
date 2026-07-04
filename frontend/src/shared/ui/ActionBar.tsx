import type { ReactNode } from "react";

export const ActionBar = ({ children, sticky = false }: { children: ReactNode; sticky?: boolean }) => (
  <div className={sticky ? "civitas-bottom-action-bar" : "civitas-action-bar"}>{children}</div>
);
