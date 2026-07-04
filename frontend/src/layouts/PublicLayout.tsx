import type { ReactNode } from "react";
import { AppShell } from "./AppShell";

export const PublicLayout = ({ children, actions }: { children: ReactNode; actions?: ReactNode }) => <AppShell area="public" actions={actions}>{children}</AppShell>;
