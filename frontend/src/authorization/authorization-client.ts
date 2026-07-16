import { useMemo } from "react";
import { useApi } from "../api/base";

export type AuthorizationContextResponse = {
  organizationId: string;
  policyVersion: string;
  catalogVersion: string;
  overlayVersion?: string;
  visualVersion?: string;
  tokenPermissions: string[];
  effectivePermissions: string[];
  effectiveActions?: string[];
  dataScopeSummary?: { availableCapabilities: string[]; dimensions?: string[] };
  enabledFeatures?: string[];
  reasonCodes?: string[];
};

export const useAuthorizationContextClient = () => {
  const { organizationApiFetch } = useApi();
  return useMemo(() => ({
    getTenantAuthorizationContext: (organizationId: string): Promise<AuthorizationContextResponse> => organizationApiFetch(organizationId, `/o/${encodeURIComponent(organizationId)}/me/authorization-context`),
  }), [organizationApiFetch]);
};
