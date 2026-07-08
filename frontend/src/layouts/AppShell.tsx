import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLogto } from "@logto/react";
import type { Icon } from "@tabler/icons-react";
import {
  IconArrowLeft,
  IconBuilding,
  IconChevronLeft,
  IconChevronRight,
  IconFiles,
  IconLayoutDashboard,
  IconLogout,
  IconServer,
  IconSettings,
  IconWorld,
} from "@tabler/icons-react";
import civitasIcon from "../assets/brand/civitas-icon.svg";
import civitasLogoFullDark from "../assets/brand/civitas-logo-full-dark.svg";
import { APP_ENV } from "../env";
import { appRoutes } from "../navigation/routes";
import { NavCollapse } from "../shared/ui";

export type ShellArea = "public" | "owner" | "organization-admin" | "organization-member";

type NavItem = { label: string; path: string; icon: Icon; match?: (pathname: string) => boolean };

type AppShellProps = {
  area: ShellArea;
  children: ReactNode;
  navItems?: NavItem[];
  organizationId?: string;
  showBackButton?: boolean;
  actions?: ReactNode;
};

const defaultOwnerNavItems: NavItem[] = [
  { label: "Overview", path: appRoutes.owner.path, icon: IconLayoutDashboard, match: (pathname) => pathname === appRoutes.owner.path },
  { label: "Organizations", path: appRoutes.ownerOrganizations.path, icon: IconBuilding, match: (pathname) => pathname === appRoutes.ownerOrganizations.path || pathname.startsWith("/owner/organizations/") },
  { label: "Create", path: appRoutes.ownerCreateOrganization.path, icon: IconBuilding, match: (pathname) => pathname.startsWith(appRoutes.ownerCreateOrganization.path) },
  { label: "Runtime", path: appRoutes.ownerWorkerQueues.path, icon: IconServer, match: (pathname) => pathname.startsWith(appRoutes.ownerWorkerQueues.path) },
  { label: "Settings", path: appRoutes.ownerSystem.path, icon: IconSettings, match: (pathname) => pathname.startsWith(appRoutes.ownerSystem.path) },
];

const publicNavItems: NavItem[] = [{ label: "Public", path: "/", icon: IconWorld, match: (pathname) => pathname === "/" }];

const organizationNavItems = (organizationId?: string): NavItem[] => {
  const basePath = organizationId ? `/${encodeURIComponent(organizationId)}` : "/";
  return [
    { label: "Workspace", path: basePath, icon: IconBuilding, match: (pathname) => pathname === basePath },
    { label: "Documents", path: basePath, icon: IconFiles, match: (pathname) => pathname === basePath },
  ];
};

const areaLabel: Record<ShellArea, string> = {
  public: "Public visitor",
  owner: "Owner global",
  "organization-admin": "Organization admin",
  "organization-member": "Organization member",
};

const resolveNavItems = (area: ShellArea, organizationId?: string, navItems?: NavItem[]) => {
  if (navItems) return navItems;
  if (area === "owner") return defaultOwnerNavItems;
  if (area === "public") return publicNavItems;
  return organizationNavItems(organizationId);
};

export const AppShell = ({ area, children, navItems, organizationId, showBackButton = false, actions }: AppShellProps) => {
  const navigate = useNavigate();
  const { signOut } = useLogto();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const resolvedNavItems = resolveNavItems(area, organizationId, navItems);
  const homePath = area === "public" ? "/" : appRoutes.owner.path;

  return (
    <div
      className={`civitas-shell civitas-shell-${area} ${sidebarCollapsed ? "civitas-shell-sidebar-collapsed" : ""}`}
      data-civitas-shell="true"
      data-civitas-area={area}
      data-civitas-sidebar-collapsed={sidebarCollapsed}
    >
      <aside className="civitas-sidebar" aria-label={`${areaLabel[area]} sidebar`}>
        <div className="civitas-sidebar-brand-row">
          <Link to={homePath} className="civitas-sidebar-brand" aria-label="Civitas home">
            <img src={sidebarCollapsed ? civitasIcon : civitasLogoFullDark} alt="Civitas" className={sidebarCollapsed ? "civitas-brand-icon" : "civitas-brand-logo"} />
          </Link>
          <button
            type="button"
            className="civitas-sidebar-toggle"
            aria-label={sidebarCollapsed ? "Expand Civitas sidebar" : "Collapse Civitas sidebar"}
            aria-pressed={sidebarCollapsed}
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          >
            {sidebarCollapsed ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
          </button>
        </div>
        <NavCollapse items={resolvedNavItems} label={areaLabel[area]} collapsed={sidebarCollapsed} />
      </aside>
      <div className="civitas-shell-content">
        <header className="civitas-topbar">
          <div className="civitas-topbar-inner">
            <div className="civitas-cluster">
              {showBackButton ? <button type="button" onClick={() => navigate(-1)} className="civitas-secondary-button"><IconArrowLeft size={18} />Back</button> : null}
              <span className="civitas-role-badge">{areaLabel[area]}</span>
              {organizationId ? <span className="civitas-context-badge">{organizationId}</span> : null}
            </div>
            {actions ?? (area === "public" ? null : <button onClick={() => signOut(APP_ENV.app.signOutRedirectUri)} className="civitas-secondary-button"><IconLogout size={18} />Sign out</button>)}
          </div>
        </header>
        <main className="civitas-main">{children}</main>
      </div>
    </div>
  );
};
