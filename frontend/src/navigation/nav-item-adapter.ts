import type { Icon } from "@tabler/icons-react";
import { iconRegistry } from "./icon-registry";
import type { ResolvedNavigationItem } from "./build-navigation-tree";
export type ShellNavItem = { label: string; path?: string; icon: Icon; match?: (pathname: string) => boolean; level?: number; children?: ShellNavItem[] };
export const toShellNavItems = (items: readonly ResolvedNavigationItem[]): ShellNavItem[] => items.map((item) => ({ label: item.label, path: item.route, icon: item.iconKey ? iconRegistry[item.iconKey] : iconRegistry.dashboard, match: (pathname) => Boolean(item.route) && (pathname === item.route || (item.route?.includes(":") ? false : pathname.startsWith(`${item.route}/`))), children: item.children.length ? toShellNavItems(item.children) : undefined }));
