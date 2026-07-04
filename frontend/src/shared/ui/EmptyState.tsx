import type { ReactNode } from "react";

export const EmptyState = ({ message, children }: { message: ReactNode; children?: ReactNode }) => (
  <div className="civitas-state" data-civitas-empty-state="true">
    <div>{message}</div>
    {children ? <div className="civitas-state-actions">{children}</div> : null}
  </div>
);
