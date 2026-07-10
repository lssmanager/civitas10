import { Link, useLocation } from "react-router-dom";
import type { Icon } from "@tabler/icons-react";

export type NavCollapseItem = {
  label: string;
  path: string;
  icon?: Icon;
  match?: (pathname: string) => boolean;
  level?: number;
};

export const NavCollapse = ({ items, label, collapsed = false }: { items: NavCollapseItem[]; label: string; collapsed?: boolean }) => {
  const location = useLocation();

  const links = items.map((item) => {
    const active = item.match ? item.match(location.pathname) : location.pathname === item.path;
    const Icon = item.icon;
    return (
      <Link key={`${item.label}-${item.path}`} to={item.path} className={`civitas-nav-link ${active ? "civitas-nav-link-active" : ""}`} data-civitas-nav-level={item.level ?? 0} title={collapsed ? item.label : undefined} aria-label={collapsed ? item.label : undefined}>
        {Icon ? <Icon className="civitas-nav-link-icon" size={20} /> : null}
        <span className="civitas-nav-link-label">{item.label}</span>
      </Link>
    );
  });

  return (
    <div className="civitas-nav-row" data-civitas-nav="true" data-civitas-nav-collapsed={collapsed}>
      <nav className="civitas-primary-nav civitas-scroll-x civitas-nowrap-children" aria-label={`${label} navigation`}>
        {links}
      </nav>
    </div>
  );
};
