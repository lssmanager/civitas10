import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLogto } from "@logto/react";
import { APP_ENV } from "../env";
import { appRoutes } from "../navigation/routes";
import { NavCollapse } from "../shared/ui";

export type ShellArea = "public" | "owner" | "organization-admin" | "organization-member";

type NavItem = { label: string; path: string; match?: (pathname: string) => boolean };

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

const publicNavItems: NavItem[] = [{ label: "Public", path: "/", match: (pathname) => pathname === "/" }];

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
  const navigate = useNavigate();
  const { signOut } = useLogto();
  const resolvedNavItems = resolveNavItems(area, organizationId, navItems);

  return (
    <div className={`civitas-shell civitas-shell-${area}`} data-civitas-shell="true" data-civitas-area={area}>
      <header className="civitas-topbar">
        <div className="civitas-topbar-inner">
          <div className="civitas-cluster">
            {showBackButton ? <button type="button" onClick={() => navigate(-1)} className="civitas-secondary-button">Back</button> : null}
            <Link to={area === "public" ? "/" : appRoutes.owner.path} className="civitas-brand">Civitas 1.1</Link>
            <NavCollapse
              items={resolvedNavItems}
              label={areaLabel[area]}
              context={(
                <>
                  <span className="civitas-role-badge">{areaLabel[area]}</span>
                  {organizationId ? <span className="civitas-context-badge">{organizationId}</span> : null}
                </>
              )}
            />
          </div>
          {actions ?? (area === "public" ? null : <button onClick={() => signOut(APP_ENV.app.signOutRedirectUri)} className="civitas-secondary-button">Sign out</button>)}
        </div>
      </header>
      <main className="civitas-main">{children}</main>
    </div>
  );
};
