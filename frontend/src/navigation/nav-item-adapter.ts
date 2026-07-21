import type { Icon } from "@tabler/icons-react";
import { assertKnownIconKey, iconRegistry } from "./icon-registry";
import type { IconKey, MenuKey, ScreenId } from "../authorization/contracts/ids";

export type NavigationAdapterItem = {
  screenId?: ScreenId;
  menuKey?: MenuKey;
  label: string;
  labelKey?: string;
  route?: string | unknown;
  path?: string;
  iconKey: IconKey;
  children?: readonly NavigationAdapterItem[];
  status?: string;
};
export type ShellNavItem = { label: string; path?: string; icon: Icon; match?: (pathname: string) => boolean; level?: number; children?: ShellNavItem[]; status?: string };
const itemPath = (item: NavigationAdapterItem) => typeof item.route === "string" ? item.route : item.path;
const resolveIcon = (item: NavigationAdapterItem) => {
  if (!assertKnownIconKey(item.iconKey)) {
    if (import.meta.env.DEV) throw new Error(`Unknown navigation iconId: ${item.iconKey}`);
    console.warn(`Unknown navigation iconId: ${item.iconKey}; using overview recovery icon.`);
    return iconRegistry.overview;
  }
  return iconRegistry[item.iconKey];
};
export const toShellNavItems = (items: readonly NavigationAdapterItem[]): ShellNavItem[] => items.map((item) => {
  const path = itemPath(item);
  return {
    label: item.label,
    path,
    icon: resolveIcon(item),
    match: (pathname) => Boolean(path) && (pathname === path || (path?.includes(":") ? false : pathname.startsWith(`${path}/`))),
    children: item.children?.length ? toShellNavItems(item.children) : undefined,
    status: item.status,
  };
});
