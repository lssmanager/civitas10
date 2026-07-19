import type { ReactNode } from "react";

export const FormDrawer = ({ title, open, children, actions, onClose }: { title: ReactNode; open: boolean; children: ReactNode; actions?: ReactNode; onClose: () => void }) => {
  if (!open) return null;
  return (
    <aside className="civitas-form-drawer" role="dialog" aria-modal="true" aria-labelledby="civitas-form-drawer-title" data-civitas-pattern="form-drawer">
      <div className="civitas-card-header">
        <h2 id="civitas-form-drawer-title" className="civitas-card-title">{title}</h2>
        <button type="button" className="civitas-secondary-button" onClick={onClose}>Close</button>
      </div>
      <div className="civitas-workspace-stack">{children}</div>
      {actions ? <div className="civitas-action-bar">{actions}</div> : null}
    </aside>
  );
};
