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
  business?: {
    country?: string;
    state?: string;
    city?: string;
    phonePrefix?: string;
    location?: {
      countryId?: number;
      stateId?: number;
      cityId?: number;
      manualCity?: string;
      phonePrefix?: string;
      countryCode?: string;
      stateCode?: string;
      source?: "dr5hn/countries-states-cities-database";
    };
  };
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
