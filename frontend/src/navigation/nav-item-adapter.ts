import type { Icon } from "@tabler/icons-react";
import { iconRegistry } from "./icon-registry";
import type { IconKey, MenuKey, ScreenId } from "../authorization/contracts/ids";

export type NavigationAdapterItem = {
  screenId?: ScreenId;
  menuKey?: MenuKey;
  label: string;
  labelKey?: string;
  route?: string | unknown;
  path?: string;
  iconKey?: IconKey;
  children?: readonly NavigationAdapterItem[];
};
export type ShellNavItem = { label: string; path?: string; icon: Icon; match?: (pathname: string) => boolean; level?: number; children?: ShellNavItem[] };
const itemPath = (item: NavigationAdapterItem) => typeof item.route === "string" ? item.route : item.path;
export const toShellNavItems = (items: readonly NavigationAdapterItem[]): ShellNavItem[] => items.map((item) => {
  const path = itemPath(item);
  return {
    label: item.label,
    path,
    icon: item.iconKey ? iconRegistry[item.iconKey] : iconRegistry.dashboard,
    match: (pathname) => Boolean(path) && (pathname === path || (path?.includes(":") ? false : pathname.startsWith(`${path}/`))),
    children: item.children?.length ? toShellNavItems(item.children) : undefined,
  };
});
