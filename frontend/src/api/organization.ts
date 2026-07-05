import { useApi } from './base';
import { useMemo } from 'react';
import { useLogto } from '@logto/react';
import { Document } from '../pages/OrganizationPage/types';

export const useOrganizationApi = () => {
  const { organizationApiFetch } = useApi();
  const { getOrganizationToken, getOrganizationTokenClaims } = useLogto();

  return useMemo(() => ({
    getDocuments: async (organizationId: string): Promise<Document[]> => {
      return await organizationApiFetch(organizationId, '/documents', {
        method: 'GET',
      });
    },

    createDocument: async (organizationId: string, data: {
      title: string;
      content: string;
    }): Promise<Document> => {
      return await organizationApiFetch(organizationId, '/documents', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getUserOrganizationScopes: async (organizationId: string): Promise<string[]> => {
      const organizationToken = await getOrganizationToken(organizationId);
      if (!organizationToken) {
        throw new Error("User is not a member of the organization");
      }

      const tokenClaims = await getOrganizationTokenClaims(organizationId);
      return tokenClaims?.scope?.split(" ") || [];
    },
  }), [organizationApiFetch, getOrganizationToken, getOrganizationTokenClaims]);
}; 