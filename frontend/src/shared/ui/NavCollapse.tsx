import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { Icon } from "@tabler/icons-react";
import { IconChevronRight } from "@tabler/icons-react";

const NAV_TREE_STORAGE_KEY = "civitas:nav-tree-expanded";

export type NavCollapseItem = {
  label: string;
  path?: string;
  icon?: Icon;
  match?: (pathname: string) => boolean;
  level?: number;
  children?: NavCollapseItem[];
};

const itemKey = (item: NavCollapseItem) => `${item.label}-${item.path || "group"}`;
const itemIsActive = (item: NavCollapseItem, pathname: string) => item.match ? item.match(pathname) : item.path === pathname;
const itemCanBeSelfActive = (item: NavCollapseItem, pathname: string) => Boolean(item.path) && itemIsActive(item, pathname);
const itemOrChildIsActive = (item: NavCollapseItem, pathname: string): boolean => itemCanBeSelfActive(item, pathname) || Boolean(item.children?.some((child) => itemOrChildIsActive(child, pathname)));

const collectActiveParentKeys = (items: NavCollapseItem[], pathname: string): string[] => items.flatMap((item) => {
  if (!item.children?.length) return [];
  const childKeys = collectActiveParentKeys(item.children, pathname);
  return itemOrChildIsActive(item, pathname) ? [itemKey(item), ...childKeys] : childKeys;
});

const readStoredExpanded = () => {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(NAV_TREE_STORAGE_KEY) || "null");
    return Array.isArray(parsed) ? parsed.filter((key): key is string => typeof key === "string") : null;
  } catch {
    return null;
  }
};

export const NavCollapse = ({ items, label, collapsed = false }: { items: NavCollapseItem[]; label: string; collapsed?: boolean }) => {
  const location = useLocation();
  const activeParentKeys = useMemo(
    () => collectActiveParentKeys(items, location.pathname),
    [items, location.pathname],
  );
  const [expandedKeys, setExpandedKeys] = useState<string[]>(() => readStoredExpanded() ?? activeParentKeys.slice(0, 1));

  useEffect(() => {
    setExpandedKeys((current) => Array.from(new Set([...current, ...activeParentKeys])));
  }, [activeParentKeys]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(NAV_TREE_STORAGE_KEY, JSON.stringify(expandedKeys));
  }, [expandedKeys]);

  const toggleExpanded = (key: string) => {
    setExpandedKeys((current) => current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key]);
  };

  const renderLink = (item: NavCollapseItem, depth = 0) => {
    const active = itemCanBeSelfActive(item, location.pathname);
    const Icon = item.icon;
    return (
      <Link key={itemKey(item)} to={item.path || "#"} className={`civitas-nav-link ${active ? "civitas-nav-link-active" : ""}`} data-depth={depth} data-active={active} data-has-children="false" title={collapsed ? item.label : undefined} aria-label={collapsed ? item.label : undefined}>
        {Icon ? <Icon className="civitas-nav-link-icon" /> : null}
        <span className="civitas-nav-link-label">{item.label}</span>
      </Link>
    );
  };

  const renderItem = (item: NavCollapseItem, depth = item.level ?? 0) => {
    if (!item.children?.length) return renderLink(item, depth);

    const key = itemKey(item);
    const expanded = !collapsed && expandedKeys.includes(key);
    const branchActive = itemOrChildIsActive(item, location.pathname);
    const selfActive = itemCanBeSelfActive(item, location.pathname);
    const Icon = item.icon;
    return (
      <div key={key} className="civitas-nav-tree-group" data-civitas-nav-expanded={expanded} data-depth={depth}>
        <button type="button" className={`civitas-nav-link civitas-nav-tree-parent ${selfActive ? "civitas-nav-link-active" : ""}`} data-depth={depth} data-active={selfActive} data-branch-active={branchActive} data-expanded={expanded} data-has-children="true" aria-expanded={expanded} onClick={() => toggleExpanded(key)} aria-label={collapsed ? item.label : undefined}>
          {Icon ? <Icon className="civitas-nav-link-icon" /> : null}
          <span className="civitas-nav-link-label">{item.label}</span>
          <span className="civitas-nav-tree-caret" aria-hidden="true"><IconChevronRight className="civitas-nav-tree-caret-icon" /></span>
        </button>
        <div className="civitas-nav-tree-children" hidden={!expanded && !collapsed}>
          {item.children.map((child) => renderItem(child, depth + 1))}
        </div>
      </div>
    );
  };

  return (
    <div className="civitas-nav-row" data-civitas-nav="true" data-civitas-nav-collapsed={collapsed} data-civitas-nav-tree="true">
      <nav className="civitas-primary-nav" aria-label={`${label} navigation`}>
        {items.map((item) => renderItem(item, item.level ?? 0))}
      </nav>
    </div>
  );
};
