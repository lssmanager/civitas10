import type { ReactNode } from "react";
import { AppShell } from "./AppShell";
import { visualRegistry } from "../authorization/registry";
import { buildNavigationTree } from "../navigation/build-navigation-tree";
import { toShellNavItems } from "../navigation/nav-item-adapter";
import { useVisualAuthorization } from "../authorization/components/VisualAuthorizationProvider";

export const OrganizationLayout = ({ children, organizationId, isAdmin = false }: { children: ReactNode; organizationId?: string; isAdmin?: boolean }) => {
  const context = useVisualAuthorization();
  const navigation = toShellNavItems(buildNavigationTree(visualRegistry, { ...context, organizationId, status: context.status === "ready" ? "ready" : "stale" }));
  return <AppShell area={isAdmin ? "organization-admin" : "organization-member"} organizationId={organizationId} navItems={navigation}>{children}</AppShell>;
};
