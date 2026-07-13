import type { ReactNode } from "react";
import { AppShell } from "./AppShell";
import { materializeNavigationTree } from "../navigation/materialize-navigation";
import { tenantNavigationTree } from "../navigation/routes";
import { toShellNavItems } from "../navigation/nav-item-adapter";

export const OrganizationLayout = ({ children, organizationId, isAdmin = false }: { children: ReactNode; organizationId?: string; isAdmin?: boolean }) => {
  const navigation = toShellNavItems(materializeNavigationTree(tenantNavigationTree, { organizationId }));
  return <AppShell area={isAdmin ? "organization-admin" : "organization-member"} organizationId={organizationId} navItems={navigation}>{children}</AppShell>;
};
