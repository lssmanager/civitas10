import { LogtoProvider, useLogto } from "@logto/react";
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./Landing";
import Callback from "../Callback";
import OrganizationPage from "../OrganizationPage";
import OwnerOrganizationsPage from "../OwnerOrganizationsPage";
import OwnerOperationalHomePage from "../OwnerOperationalHomePage";
import OwnerOrganizationOperationalPage from "../OwnerOrganizationOperationalPage";
import OwnerWorkerQueuesPage from "../OwnerWorkerQueuesPage";
import { appRoutes } from "../../navigation/routes";
import { OwnerRouteGuard } from "../../authz/OwnerRouteGuard";
import { civitasLogtoConfig } from "../../auth/logtoConfig";

function App() {
  return (
    <LogtoProvider config={civitasLogtoConfig}>
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <Routes>
          <Route path="/callback" element={<Callback />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </div>
    </LogtoProvider>
  );
}

function AppContent() {
  const { isAuthenticated } = useLogto();
  if (!isAuthenticated) return <Landing />;
  return (
    <Routes>
      <Route path="/" element={<Navigate to={appRoutes.owner.path} replace />} />
      <Route path={appRoutes.owner.path} element={<OwnerRouteGuard><OwnerOperationalHomePage /></OwnerRouteGuard>} />
      <Route path={appRoutes.ownerOrganizations.path} element={<OwnerRouteGuard><OwnerOrganizationsPage /></OwnerRouteGuard>} />
      <Route path={appRoutes.ownerOrganizationState.path} element={<OwnerRouteGuard><OwnerOrganizationOperationalPage /></OwnerRouteGuard>} />
      <Route path={appRoutes.ownerWorkerQueues.path} element={<OwnerRouteGuard><OwnerWorkerQueuesPage /></OwnerRouteGuard>} />
      <Route path="/:orgId" element={<OrganizationPage />} />
    </Routes>
  );
}

export default App;