import { useApi } from './base';
import { useMemo } from 'react';

export type Organization = {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
  role?: string;
};

export type CreateOrganizationData = {
  name: string;
  description?: string;
};

export const useResourceApi = () => {
  const { ownerApiFetch } = useApi();

  return useMemo(() => ({
    createOrganization: async (data: CreateOrganizationData): Promise<{ data: { id: string; name?: string; description?: string | null } }> => {
      return await ownerApiFetch('/owner/organizations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  }), [ownerApiFetch]);
};
