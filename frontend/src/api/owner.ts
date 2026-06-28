import { useMemo } from "react";
import { useApi } from "./base";
import type { ConsolidatedOperationalResponse, OperationalBlock } from "../contracts/operational";

export type OwnerAuthorization = {
  logtoUserId: string;
  internalUserId: string;
  authorizedBy: "logto_global_role_and_scope";
  requiredScope: "owner:read";
  requiredWriteScope: "owner:write";
  canReadOwner: boolean;
  canWriteOwner: boolean;
  globalRoles: string[];
  scopes: string[];
};

export type OwnerMeResponse = {
  owner: OwnerAuthorization;
};

export type OwnerOrganization = {
  logtoOrganizationId: string | null;
  name: string | null;
  logtoOrganization?: Record<string, unknown> | null;
  profile: Record<string, unknown> | null;
};

export type OrganizationTemplateRole = {
  id: string;
  name: string;
};

export type OrganizationTemplateResponse = {
  roles: OrganizationTemplateRole[];
  requiredRoleNames: string[];
  missingRoleNames: string[];
  ready: boolean;
};

export type WorkerHealthAggregate = {
  contractVersion: string;
  generatedAt: string;
  workerHealth: OperationalBlock & {
    classification: string;
    readiness: string;
    heartbeat: { at: string | null; state: string };
    redis: Record<string, unknown> | null;
  };
  queues: Array<{ name: string; classification: string; waiting: number; active: number; delayed: number; failed: number; oldestJobAgeSeconds: number } & OperationalBlock>;
  activeOperations: Array<Record<string, unknown> & OperationalBlock>;
  blockedOrganizations: Array<Record<string, unknown> & OperationalBlock>;
  timeline: Array<Record<string, unknown>>;
  source: Record<string, unknown>;
};

export type AdministrativeContactInput = {
  key?: string;
  firstName: string;
  middleName?: string;
  firstSurname: string;
  secondSurname?: string;
  email: string;
  phone?: string;
  phoneExtension?: string;
  position?: string;
  organizationRoleName: string;
};

export type CreateOwnerOrganizationInput = {
  name: string;
  description?: string;
  appSubdomain: string;
  appBaseDomain: string;
  adminDomain: string;
  jitProvisioning: {
    defaultRoleNames: string[];
  };
  contact?: {
    email?: string;
    phone?: string;
    owner?: string;
  };
  business?: {
    website?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    numberOfEmployees?: string;
    industry?: string;
    type?: string;
    about?: string;
    nit?: string;
    verificationDigit?: string;
  };
  segmentation?: {
    tags?: string[];
    lists?: string[];
  };
  administrativeContacts: AdministrativeContactInput[];
};

export type CreateOwnerOrganizationResponse = {
  status: string;
  data: { id: string; name?: string; description?: string | null };
  bootstrap?: {
    firstAdminUserId: string | null;
    assignedOrganizationRole: string | null;
    administrativeContactAssignments: Array<{
      key: string;
      email: string;
      logtoUserId: string;
      roleName: string;
      userCreated: boolean;
      userSource: string;
      membershipAdded: boolean;
      roleAssigned: boolean;
    }>;
    jitProvisioning: {
      domain: string;
      defaultRoleNames: string[];
      defaultRoleIds: string[];
    };
  };
};

export const useOwnerApi = () => {
  const { fetchWithToken } = useApi();

  return useMemo(
    () => ({
      getOwnerMe: async (): Promise<OwnerMeResponse> => fetchWithToken("/owner/me"),
      getOrganizations: async (): Promise<{ organizations: OwnerOrganization[] }> => fetchWithToken("/owner/organizations"),
      getOrganizationTemplate: async (): Promise<OrganizationTemplateResponse> => fetchWithToken("/owner/organization-template"),
      getOrganizationOperationalState: async (organizationId: string): Promise<ConsolidatedOperationalResponse> => fetchWithToken(`/owner/organizations/${encodeURIComponent(organizationId)}/operational-state`),
      getWorkerQueuesObservability: async (): Promise<WorkerHealthAggregate> => fetchWithToken("/owner/system/worker-queues"),
      createOrganization: async (data: CreateOwnerOrganizationInput): Promise<CreateOwnerOrganizationResponse> =>
        fetchWithToken("/owner/organizations", {
          method: "POST",
          body: JSON.stringify(data),
        }),
    }),
    [fetchWithToken],
  );
};