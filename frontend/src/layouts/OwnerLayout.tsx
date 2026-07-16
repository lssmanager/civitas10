import type { ReactNode } from "react";
import { AppShell } from "./AppShell";
import { materializeNavigationTree } from "../navigation/materialize-navigation";
import { ownerNavigationTree } from "../navigation/routes";
import { toShellNavItems } from "../navigation/nav-item-adapter";

export const OwnerLayout = ({ children, organizationId }: { children: ReactNode; organizationId?: string }) => {
  const navigation = toShellNavItems(materializeNavigationTree(ownerNavigationTree, { organizationId }));
  return <AppShell area="owner" organizationId={organizationId} navItems={navigation}>{children}</AppShell>;
};
