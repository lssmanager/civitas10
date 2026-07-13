import { useMemo } from "react";
import { useApi } from "../../api/base";
import type { GovernanceAccessPreview, GovernanceAccessPreviewRequest, GovernanceReadModel } from "./contracts";

export const useGovernanceApi = () => {
  const { ownerApiFetch, organizationApiFetch } = useApi();

  return useMemo(() => ({
    getOwnerGovernance: (organizationId: string): Promise<GovernanceReadModel> => ownerApiFetch(`/owner/organizations/${encodeURIComponent(organizationId)}/governance`),
    getTenantGovernance: (organizationId: string): Promise<GovernanceReadModel> => organizationApiFetch(organizationId, `/o/${encodeURIComponent(organizationId)}/governance`),
    previewOwnerAccessReadOnly: (request: GovernanceAccessPreviewRequest): Promise<GovernanceAccessPreview> => ownerApiFetch(`/owner/organizations/${encodeURIComponent(request.organizationId)}/access-preview`, { method: "POST", headers: { "X-Civitas-Preview-Only": "true" }, body: JSON.stringify({ ...request, previewOnly: true }) }),
    previewTenantAccessReadOnly: (request: GovernanceAccessPreviewRequest): Promise<GovernanceAccessPreview> => organizationApiFetch(request.organizationId, `/o/${encodeURIComponent(request.organizationId)}/access-preview`, { method: "POST", headers: { "X-Civitas-Preview-Only": "true" }, body: JSON.stringify({ ...request, previewOnly: true }) }),
  }), [organizationApiFetch, ownerApiFetch]);
};
