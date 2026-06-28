import { useLogto } from "@logto/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { APP_ENV } from "../env";
import { appRoutes } from "../navigation/routes";

type TopbarProps = {
  organizationId?: string;
  showBackButton?: boolean;
};

const navLinkClass = (active: boolean) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`;

const Topbar = ({ organizationId, showBackButton = false }: TopbarProps) => {
  const { signOut } = useLogto();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          {showBackButton ? (
            <button type="button" onClick={() => navigate(-1)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              Back
            </button>
          ) : null}
          <Link to={appRoutes.owner.path} className="text-xl font-semibold text-slate-900">Civitas 1.1</Link>
          <nav className="hidden items-center gap-2 md:flex">
            <Link to={appRoutes.owner.path} className={navLinkClass(location.pathname === appRoutes.owner.path)}>Overview</Link>
            <Link to={appRoutes.ownerOrganizations.path} className={navLinkClass(location.pathname.startsWith(appRoutes.ownerOrganizations.path) && location.pathname !== appRoutes.owner.path)}>Create</Link>
            <Link to={appRoutes.ownerWorkerQueues.path} className={navLinkClass(location.pathname.startsWith(appRoutes.ownerWorkerQueues.path))}>Runtime</Link>
          </nav>
          {organizationId ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{organizationId}</span> : null}
        </div>
        <button onClick={() => signOut(APP_ENV.app.signOutRedirectUri)} className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900">Sign out</button>
      </div>
    </div>
  );
};

export default Topbar;
