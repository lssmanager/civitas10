import type { ReactNode } from "react";
import { useEffect, useState } from "react";
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
  IconMenu2,
  IconServer,
  IconSettings,
  IconWorld,
} from "@tabler/icons-react";
import civitasIcon from "../assets/brand/civitas-icon.svg";
import civitasLogoFullDark from "../assets/brand/civitas-logo-full-dark.svg";
import { APP_ENV } from "../env";
import { appRoutes } from "../navigation/routes";
import { useBreakpoint } from "../shared/hooks";
import { NavCollapse } from "../shared/ui";

export type ShellArea = "public" | "owner" | "organization-admin" | "organization-member";

type NavItem = { label: string; path?: string; icon: Icon; match?: (pathname: string) => boolean; level?: number; children?: NavItem[] };

type AppShellProps = {
  area: ShellArea;
  children: ReactNode;
  navItems?: NavItem[];
  organizationId?: string;
  showBackButton?: boolean;
  actions?: ReactNode;
};

const defaultOwnerNavItems: NavItem[] = [
  {
    label: "Overview",
    icon: IconLayoutDashboard,
    match: (pathname) => pathname === appRoutes.owner.path || pathname.startsWith(appRoutes.ownerWorkerQueues.path),
    children: [
      { label: "Overview", path: appRoutes.owner.path, icon: IconLayoutDashboard, match: (pathname) => pathname === appRoutes.owner.path },
      { label: "Runtime", path: appRoutes.ownerWorkerQueues.path, icon: IconServer, match: (pathname) => pathname.startsWith(appRoutes.ownerWorkerQueues.path) },
    ],
  },
  {
    label: "Organizations",
    icon: IconBuilding,
    match: (pathname) => pathname === appRoutes.ownerOrganizations.path || pathname.startsWith("/owner/organizations/") || pathname.startsWith(appRoutes.ownerCreateOrganization.path),
    children: [
      { label: "Directory", path: appRoutes.ownerOrganizations.path, icon: IconBuilding, match: (pathname) => pathname === appRoutes.ownerOrganizations.path || pathname.startsWith("/owner/organizations/") },
      { label: "Create", path: appRoutes.ownerCreateOrganization.path, icon: IconBuilding, match: (pathname) => pathname.startsWith(appRoutes.ownerCreateOrganization.path) },
    ],
  },
  { label: "Setup", path: appRoutes.ownerSystem.path, icon: IconSettings, match: (pathname) => pathname.startsWith(appRoutes.ownerSystem.path) && !pathname.startsWith(appRoutes.ownerWorkerQueues.path) },
];

const publicNavItems: NavItem[] = [{ label: "Public", path: "/", icon: IconWorld, match: (pathname) => pathname === "/" }];

const organizationNavItems = (organizationId?: string): NavItem[] => {
  const basePath = organizationId ? `/${encodeURIComponent(organizationId)}` : "/";
  return [
    { label: "Workspace", path: basePath, icon: IconBuilding, match: (pathname) => pathname === basePath },
    { label: "Documents", path: basePath, icon: IconFiles, match: (pathname) => pathname === basePath },
  ];
};

const SIDEBAR_STATE_STORAGE_KEY = "civitas:sidebar-state";

type SidebarState = "expanded" | "collapsed";

const readStoredSidebarState = (): SidebarState => {
  if (typeof window === "undefined") return "expanded";
  return window.localStorage.getItem(SIDEBAR_STATE_STORAGE_KEY) === "collapsed" ? "collapsed" : "expanded";
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
  const isMobile = useBreakpoint("md");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => readStoredSidebarState() === "collapsed");
  const [mobileOpen, setMobileOpen] = useState(false);
  const resolvedNavItems = resolveNavItems(area, organizationId, navItems);
  const effectiveSidebarCollapsed = isMobile ? false : sidebarCollapsed;
  const homePath = area === "public" ? "/" : appRoutes.owner.path;
  const sidebarState: SidebarState = effectiveSidebarCollapsed ? "collapsed" : "expanded";
  const mobileState = mobileOpen ? "mobile-open" : "mobile-closed";

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  return (
    <div
      className={`civitas-shell civitas-shell-${area} ${effectiveSidebarCollapsed ? "civitas-shell-sidebar-collapsed" : ""}`}
      data-civitas-shell="true"
      data-civitas-area={area}
      data-civitas-sidebar-collapsed={effectiveSidebarCollapsed}
      data-civitas-sidebar-state={sidebarState}
      data-civitas-sidebar-mobile-open={mobileOpen}
      data-civitas-sidebar-mobile-state={mobileState}
    >
      {isMobile && mobileOpen ? <button type="button" className="civitas-sidebar-backdrop" aria-label="Close Civitas navigation" onClick={() => setMobileOpen(false)} /> : null}
      <aside className="civitas-sidebar" aria-label={`${areaLabel[area]} sidebar`} data-mobile-open={mobileOpen}>
        <div className="civitas-sidebar-brand-row">
          <Link to={homePath} className="civitas-sidebar-brand" aria-label="Civitas home">
            <img src={effectiveSidebarCollapsed ? civitasIcon : civitasLogoFullDark} alt="Civitas" className={effectiveSidebarCollapsed ? "civitas-brand-icon" : "civitas-brand-logo"} />
          </Link>
          <button
            type="button"
            className="civitas-sidebar-toggle"
            aria-label={sidebarCollapsed ? "Expand Civitas sidebar" : "Collapse Civitas sidebar"}
            aria-pressed={sidebarCollapsed}
            onClick={() => setSidebarCollapsed((collapsed) => {
              const nextCollapsed = !collapsed;
              window.localStorage.setItem(SIDEBAR_STATE_STORAGE_KEY, nextCollapsed ? "collapsed" : "expanded");
              return nextCollapsed;
            })}
          >
            {sidebarCollapsed ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
          </button>
        </div>
        <NavCollapse items={resolvedNavItems} label={areaLabel[area]} collapsed={effectiveSidebarCollapsed} />
      </aside>
      <div className="civitas-shell-content">
        <header className="civitas-topbar">
          <div className="civitas-topbar-inner">
            <div className="civitas-cluster">
              {isMobile ? <button type="button" className="civitas-secondary-button civitas-icon-button civitas-mobile-menu-button" aria-label="Abrir menú" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><IconMenu2 size={18} /><span className="civitas-icon-button-label">Menu</span></button> : null}
              {showBackButton ? <button type="button" onClick={() => navigate(-1)} className="civitas-secondary-button"><IconArrowLeft size={18} />Back</button> : null}
              <span className="civitas-role-badge">{areaLabel[area]}</span>
              {organizationId ? <span className="civitas-context-badge">{organizationId}</span> : null}
            </div>
            {actions ?? (area === "public" ? null : <button onClick={() => signOut(APP_ENV.app.signOutRedirectUri)} className="civitas-secondary-button civitas-icon-button" aria-label="Cerrar sesión"><IconLogout size={18} /><span className="civitas-icon-button-label">Sign out</span></button>)}
          </div>
        </header>
        <main className="civitas-main">{children}</main>
      </div>
    </div>
  );
};
