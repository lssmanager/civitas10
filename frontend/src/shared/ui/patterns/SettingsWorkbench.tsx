import type { ReactNode } from "react";
import { GovernanceSectionNav, type GovernanceSectionNavGroup } from "../GovernanceSectionNav";

export const SettingsWorkbench = ({ groups, activeId, children }: { groups: GovernanceSectionNavGroup[]; activeId: string; children: ReactNode }) => (
  <GovernanceSectionNav label="Settings workbench" groups={groups} activeId={activeId}>{children}</GovernanceSectionNav>
);
