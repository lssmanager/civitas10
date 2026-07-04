import type { ReactNode } from "react";
import { AppShell } from "./AppShell";

export const OrganizationLayout = ({ children, organizationId, isAdmin = false }: { children: ReactNode; organizationId?: string; isAdmin?: boolean }) => (
  <AppShell area={isAdmin ? "organization-admin" : "organization-member"} organizationId={organizationId} showBackButton>{children}</AppShell>
);
