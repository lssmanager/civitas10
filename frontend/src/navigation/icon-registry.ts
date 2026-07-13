import { IconBuilding, IconLayoutDashboard, IconServer, IconUser, IconReportAnalytics, type Icon } from "@tabler/icons-react";
import type { IconKey } from "../authorization/contracts/ids";
export const iconRegistry: Record<IconKey, Icon> = { dashboard: IconLayoutDashboard, building: IconBuilding, server: IconServer, settings: IconServer, user: IconUser, grades: IconReportAnalytics };
