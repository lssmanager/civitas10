import type { ReactNode } from "react";
import { useId } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StatusPill, type StatusPillStatus } from "./StatusPill";

export type WorkspaceNavigationItem = {
  id: string;
  label: string;
  href: string;
  status?: string;
  statusTone?: StatusPillStatus;
  description?: ReactNode;
};

export type WorkspaceNavigationGroup = {
  id: string;
  label: string;
  items: WorkspaceNavigationItem[];
};

export const WorkspaceShell = ({
  label,
  groups,
  activeId,
  children,
}: {
  label: string;
  groups: WorkspaceNavigationGroup[];
  activeId: string;
  children: ReactNode;
}) => {
  const selectId = useId();
  const navigate = useNavigate();
  const flatItems = groups.flatMap((group) => group.items.map((item) => ({ ...item, groupLabel: group.label })));

  return (
    <div className="grid gap-4 md:grid-cols-[18rem_minmax(0,1fr)]" data-civitas-workspace-shell="true">
      <aside className="civitas-card civitas-pad-tight" aria-label={label}>
        <div className="md:hidden">
          <label className="civitas-label" htmlFor={selectId}>{label}</label>
          <select id={selectId} className="civitas-input" value={activeId} onChange={(event) => {
            const item = flatItems.find((candidate) => candidate.id === event.target.value);
            if (item) navigate(item.href);
          }}>
            {flatItems.map((item) => <option key={item.id} value={item.id}>{item.groupLabel} — {item.label}</option>)}
          </select>
        </div>
        <nav className="hidden md:flex md:flex-col md:gap-5" aria-label={label}>
          {groups.map((group) => (
            <section key={group.id} aria-labelledby={`${group.id}-workspace-group`}>
              <p id={`${group.id}-workspace-group`} className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{group.label}</p>
              <div className="mt-3 flex flex-col gap-1">
                {group.items.map((item) => {
                  const active = item.id === activeId;
                  return (
                    <Link key={item.id} to={item.href} aria-current={active ? "page" : undefined} className={active ? "civitas-nav-link civitas-nav-link-active" : "civitas-nav-link"}>
                      <span className="min-w-0 flex-1">{item.label}</span>
                      {item.status ? <StatusPill status={item.statusTone || "neutral"} noDot>{item.status}</StatusPill> : null}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
      </aside>
      <section className="min-w-0" aria-labelledby="workspace-section-title">
        {children}
      </section>
    </div>
  );
};
