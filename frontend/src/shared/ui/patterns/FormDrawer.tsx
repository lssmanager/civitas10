import { useEffect, useRef, type ReactNode } from "react";

export const FormDrawer = ({ title, open, children, actions, onClose }: { title: ReactNode; open: boolean; children: ReactNode; actions?: ReactNode; onClose: () => void }) => {
  const drawerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    drawerRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "Tab" && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current) previousFocusRef.current.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <aside ref={drawerRef} className="civitas-form-drawer" role="dialog" aria-modal="true" aria-labelledby="civitas-form-drawer-title" data-civitas-pattern="form-drawer" tabIndex={-1}>
      <div className="civitas-card-header">
        <h2 id="civitas-form-drawer-title" className="civitas-card-title">{title}</h2>
        <button type="button" className="civitas-secondary-button" onClick={onClose}>Close</button>
      </div>
      <div className="civitas-workspace-stack">{children}</div>
      {actions ? <div className="civitas-action-bar">{actions}</div> : null}
    </aside>
  );
};
