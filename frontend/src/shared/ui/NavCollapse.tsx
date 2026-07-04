import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useBreakpoint } from "../hooks";

export type NavCollapseItem = { label: string; path: string; match?: (pathname: string) => boolean };

export const NavCollapse = ({ items, label, context }: { items: NavCollapseItem[]; label: string; context?: ReactNode }) => {
  const location = useLocation();
  const isCompact = useBreakpoint("md");

  const links = items.map((item) => {
    const active = item.match ? item.match(location.pathname) : location.pathname === item.path;
    return <Link key={`${item.label}-${item.path}`} to={item.path} className={`civitas-nav-link ${active ? "civitas-nav-link-active" : ""}`}>{item.label}</Link>;
  });

  if (isCompact) {
    return (
      <details className="civitas-nav-collapse" data-civitas-nav="true">
        <summary className="civitas-nav-collapse-summary">{label}</summary>
        <nav className="civitas-primary-nav civitas-primary-nav-compact civitas-scroll-x civitas-nowrap-children" aria-label={`${label} navigation`}>
          {links}
        </nav>
        {context ? <div className="civitas-nav-collapse-context">{context}</div> : null}
      </details>
    );
  }

  return (
    <div className="civitas-nav-row" data-civitas-nav="true">
      <nav className="civitas-primary-nav civitas-scroll-x civitas-nowrap-children" aria-label={`${label} navigation`}>
        {links}
      </nav>
      {context}
    </div>
  );
};
