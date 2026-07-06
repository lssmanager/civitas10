import { LogtoProvider, LogtoConfig, useLogto } from "@logto/react";
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./Landing";
import Callback from "../Callback";
import OrganizationPage from "../OrganizationPage";
import OwnerOrganizationsPage from "../OwnerOrganizationsPage";
import OwnerOperationalHomePage from "../OwnerOperationalHomePage";
import OwnerOrganizationOperationalPage from "../OwnerOrganizationOperationalPage";
import OwnerWorkerQueuesPage from "../OwnerWorkerQueuesPage";
import { APP_ENV } from "../../env";
import { appRoutes } from "../../navigation/routes";
import { OwnerRouteGuard } from "../../authz/OwnerRouteGuard";

const config: LogtoConfig = {
  endpoint: APP_ENV.logto.endpoint,
  appId: APP_ENV.logto.appId,
  scopes: ["openid", "profile", "email", "offline_access"],
  resources: [APP_ENV.api.resource],
};

function App() {
  return (
    <LogtoProvider config={config}>
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