import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLogto } from "@logto/react";
import { APP_ENV } from "../../env";
import { appRoutes } from "../../navigation/routes";

type ShellArea = "public" | "owner" | "organization-admin" | "organization-member";

type NavItem = {
  label: string;
  path: string;
  match?: (pathname: string) => boolean;
};

type AppShellProps = {
  area: ShellArea;
  children: ReactNode;
  navItems?: NavItem[];
  organizationId?: string;
  showBackButton?: boolean;
  actions?: ReactNode;
};

const defaultOwnerNavItems: NavItem[] = [
  { label: "Overview", path: appRoutes.owner.path, match: (pathname) => pathname === appRoutes.owner.path },
  { label: "Create", path: appRoutes.ownerOrganizations.path, match: (pathname) => pathname.startsWith(appRoutes.ownerOrganizations.path) },
  { label: "Runtime", path: appRoutes.ownerWorkerQueues.path, match: (pathname) => pathname.startsWith(appRoutes.ownerWorkerQueues.path) },
];

const publicNavItems: NavItem[] = [
  { label: "Public", path: "/", match: (pathname) => pathname === "/" },
];

const organizationNavItems = (organizationId?: string): NavItem[] => {
  const basePath = organizationId ? `/${encodeURIComponent(organizationId)}` : "/";
  return [
    { label: "Workspace", path: basePath, match: (pathname) => pathname === basePath },
    { label: "Documents", path: basePath, match: (pathname) => pathname === basePath },
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
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useLogto();
  const resolvedNavItems = resolveNavItems(area, organizationId, navItems);

  return (
    <div className={`civitas-shell civitas-shell-${area}`} data-civitas-shell="true" data-civitas-area={area}>
      <header className="civitas-topbar">
        <div className="civitas-topbar-inner">
          <div className="flex min-w-0 items-center gap-6">
            {showBackButton ? (
              <button type="button" onClick={() => navigate(-1)} className="civitas-secondary-button">
                Back
              </button>
            ) : null}
            <Link to={area === "public" ? "/" : appRoutes.owner.path} className="shrink-0 text-xl font-semibold text-slate-950">
              Civitas 1.1
            </Link>
            <nav className="civitas-primary-nav" aria-label={`${areaLabel[area]} navigation`} data-civitas-nav="true">
              {resolvedNavItems.map((item) => {
                const active = item.match ? item.match(location.pathname) : location.pathname === item.path;
                return <Link key={`${item.label}-${item.path}`} to={item.path} className={`civitas-nav-link ${active ? "civitas-nav-link-active" : ""}`}>{item.label}</Link>;
              })}
            </nav>
            <span className="civitas-badge bg-slate-100 text-slate-700">{areaLabel[area]}</span>
            {organizationId ? <span className="civitas-badge bg-blue-100 text-blue-700">{organizationId}</span> : null}
          </div>
          {actions ?? (area === "public" ? null : <button onClick={() => signOut(APP_ENV.app.signOutRedirectUri)} className="civitas-secondary-button">Sign out</button>)}
        </div>
      </header>
      <main className="civitas-main">{children}</main>
    </div>
  );
};

export const PublicLayout = ({ children, actions }: { children: ReactNode; actions?: ReactNode }) => <AppShell area="public" actions={actions}>{children}</AppShell>;
export const OwnerLayout = ({ children, organizationId }: { children: ReactNode; organizationId?: string }) => <AppShell area="owner" organizationId={organizationId}>{children}</AppShell>;
export const OrganizationLayout = ({ children, organizationId, isAdmin = false }: { children: ReactNode; organizationId?: string; isAdmin?: boolean }) => (
  <AppShell area={isAdmin ? "organization-admin" : "organization-member"} organizationId={organizationId} showBackButton>{children}</AppShell>
);
