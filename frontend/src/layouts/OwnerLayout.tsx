import type { ReactNode } from "react";
import { AppShell } from "./AppShell";
import { visualRegistry } from "../authorization/registry";
import { buildNavigationTree } from "../navigation/build-navigation-tree";
import { toShellNavItems } from "../navigation/nav-item-adapter";
import { useVisualAuthorization } from "../authorization/components/VisualAuthorizationProvider";

export const OwnerLayout = ({ children, organizationId }: { children: ReactNode; organizationId?: string }) => {
  const context = useVisualAuthorization();
  const navigation = toShellNavItems(buildNavigationTree(visualRegistry, { ...context, status: context.status === "ready" ? "ready" : "stale" }));
  return <AppShell area="owner" organizationId={organizationId} navItems={navigation}>{children}</AppShell>;
};
