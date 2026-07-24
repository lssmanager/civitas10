import { IconBuilding, IconCirclePlus, IconLayoutDashboard, IconReportAnalytics, IconScale, IconUsersGroup, IconCalendarStats, IconServer, IconSettings, IconUser, type Icon } from "@tabler/icons-react";
import type { IconKey } from "../authorization/contracts/ids";

export const iconRegistry: Record<IconKey, Icon> = {
  overview: IconLayoutDashboard,
  governance: IconScale,
  operations: IconServer,
  organizations: IconBuilding,
  directory: IconBuilding,
  create: IconCirclePlus,
  settings: IconSettings,
  profile: IconUser,
  grades: IconReportAnalytics,
  groups: IconUsersGroup,
  planning: IconCalendarStats,
};

export const assertKnownIconKey = (iconKey: string): iconKey is IconKey => Object.prototype.hasOwnProperty.call(iconRegistry, iconKey);
