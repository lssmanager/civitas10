import { useMemo } from "react";
import { useApi } from "../../api/base";
import { validateGovernanceReadModel, type GovernanceAccessPreview, type GovernanceAccessPreviewRequest, type GovernanceReadModel } from "./contracts";

const assertGovernanceReadModel = (response: unknown): GovernanceReadModel => {
  const contract = validateGovernanceReadModel(response);
  if (!contract.ok) throw new Error(`Governance read model contract ${contract.version || "unknown"} failed at ${contract.path}: ${contract.reason}`);
  return contract.value;
};

export const useGovernanceApi = () => {
  const { ownerApiFetch, organizationApiFetch } = useApi();

  return useMemo(() => ({
    getOwnerGovernance: async (organizationId: string): Promise<GovernanceReadModel> => assertGovernanceReadModel(await ownerApiFetch(`/owner/organizations/${encodeURIComponent(organizationId)}/governance`)),
    getTenantGovernance: async (organizationId: string): Promise<GovernanceReadModel> => assertGovernanceReadModel(await organizationApiFetch(organizationId, `/o/${encodeURIComponent(organizationId)}/governance`)),
    previewOwnerAccessReadOnly: (request: GovernanceAccessPreviewRequest): Promise<GovernanceAccessPreview> => ownerApiFetch(`/owner/organizations/${encodeURIComponent(request.organizationId)}/access-preview`, { method: "POST", headers: { "X-Civitas-Preview-Only": "true" }, body: JSON.stringify({ ...request, previewOnly: true }) }),
    previewTenantAccessReadOnly: (request: GovernanceAccessPreviewRequest): Promise<GovernanceAccessPreview> => organizationApiFetch(request.organizationId, `/o/${encodeURIComponent(request.organizationId)}/access-preview`, { method: "POST", headers: { "X-Civitas-Preview-Only": "true" }, body: JSON.stringify({ ...request, previewOnly: true }) }),
  }), [organizationApiFetch, ownerApiFetch]);
};
