import { LogtoProvider, useLogto } from "@logto/react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import Landing from "./Landing";
import Callback from "../Callback";
import OrganizationPage from "../OrganizationPage";
import OwnerOrganizationsPage from "../OwnerOrganizationsPage";
import OwnerOrganizationsIndexPage from "../OwnerOrganizationsIndexPage";
import OwnerOperationalHomePage from "../OwnerOperationalHomePage";
import OwnerOrganizationOperationalPage from "../OwnerOrganizationOperationalPage";
import OwnerWorkerQueuesPage from "../OwnerWorkerQueuesPage";
import { GovernanceStudioPage } from "../../features/governance/GovernanceStudioPage";
import { appRoutes } from "../../navigation/routes";
import { OwnerRouteGuard } from "../../authz/OwnerRouteGuard";
import { ScreenGate } from "../../authorization/components/ScreenGate";
import { TenantAuthorizationProvider } from "../../authorization/AuthorizationProvider";
import { civitasLogtoConfig } from "../../auth/logtoConfig";

function App() {
  return (
    <LogtoProvider config={civitasLogtoConfig}>
      <div className="min-h-screen bg-bg text-text">
        <Routes>
          <Route path="/callback" element={<Callback />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </div>
    </LogtoProvider>
  );
}

function TenantGovernanceRoute() {
  const { organizationId = "" } = useParams();
  return (
    <TenantAuthorizationProvider organizationId={organizationId}>
      <ScreenGate screenId="tenant-governance"><GovernanceStudioPage surface="tenant" /></ScreenGate>
    </TenantAuthorizationProvider>
  );
}

function AppContent() {
  const { isAuthenticated } = useLogto();
  if (!isAuthenticated) return <Landing />;
  return (
    <Routes>
      <Route path="/" element={<Navigate to={appRoutes.owner.path} replace />} />
      <Route path={appRoutes.owner.path} element={<OwnerRouteGuard><ScreenGate screenId="owner-overview"><OwnerOperationalHomePage /></ScreenGate></OwnerRouteGuard>} />
      <Route path={appRoutes.ownerOrganizations.path} element={<OwnerRouteGuard><ScreenGate screenId="owner-organizations"><OwnerOrganizationsIndexPage /></ScreenGate></OwnerRouteGuard>} />
      <Route path={appRoutes.ownerCreateOrganization.path} element={<OwnerRouteGuard><ScreenGate screenId="owner-organizations-create"><OwnerOrganizationsPage /></ScreenGate></OwnerRouteGuard>} />
      <Route path={appRoutes.ownerOrganizationState.path} element={<OwnerRouteGuard><ScreenGate screenId="owner-organization-state"><OwnerOrganizationOperationalPage /></ScreenGate></OwnerRouteGuard>} />
      <Route path={appRoutes.ownerGovernance.path} element={<Navigate to={appRoutes.ownerOrganizations.path} replace />} />
      <Route path={appRoutes.ownerOrganizationGovernance.path} element={<OwnerRouteGuard><ScreenGate screenId="owner-governance"><GovernanceStudioPage surface="owner" /></ScreenGate></OwnerRouteGuard>} />
      <Route path={appRoutes.ownerSystem.path} element={<OwnerRouteGuard><ScreenGate screenId="owner-worker-queues"><OwnerWorkerQueuesPage /></ScreenGate></OwnerRouteGuard>} />
      <Route path={appRoutes.ownerWorkerQueues.path} element={<OwnerRouteGuard><ScreenGate screenId="owner-worker-queues"><OwnerWorkerQueuesPage /></ScreenGate></OwnerRouteGuard>} />
      <Route path={appRoutes.tenantGovernance.path} element={<TenantGovernanceRoute />} />
      <Route path="/:orgId" element={<OrganizationPage />} />
    </Routes>
  );
}

export default App;
