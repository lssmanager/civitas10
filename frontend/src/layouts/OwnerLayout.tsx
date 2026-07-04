import type { ReactNode } from "react";
import { AppShell } from "./AppShell";

export const OwnerLayout = ({ children, organizationId }: { children: ReactNode; organizationId?: string }) => <AppShell area="owner" organizationId={organizationId}>{children}</AppShell>;
