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
  canonicalSource?: "logto";
  profile: Record<string, unknown> | null;
  runtimeState?: Record<string, unknown> | null;
  bootstrap?: Record<string, unknown> | null;
  legacy?: Record<string, unknown> | null;
};

export type OrganizationTemplateRole = {
  id: string;
  name: string;
};

export type OrganizationTemplateResponse = {
  roles: OrganizationTemplateRole[];
  requiredRoleNames?: string[];
  missingRoleNames?: string[];
  roleSource?: string;
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
  username?: string;
};

export type CreateOwnerOrganizationInput = {
  idempotencyKey?: string;
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
  idempotencyKey: string;
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

export type OrganizationProvisioningDraft = {
  idempotencyKey: string;
  currentStage: string;
  stagePayloads: Record<string, unknown>;
  consolidatedPayload: Record<string, unknown>;
  status: string;
  submitStatus: string;
  logtoOrganizationId?: string | null;
  canonicalSource: "logto";
  localPurpose: "operational_wizard_draft_only";
};

export const useOwnerApi = () => {
  const { ownerApiFetch } = useApi();

  return useMemo(
    () => ({
      getOwnerMe: async (): Promise<OwnerMeResponse> => ownerApiFetch("/owner/me"),
      getOrganizations: async (): Promise<{ organizations: OwnerOrganization[] }> => ownerApiFetch("/owner/organizations"),
      getOrganizationTemplate: async (): Promise<OrganizationTemplateResponse> => ownerApiFetch("/owner/organization-template"),
      saveOrganizationDraft: async (data: { idempotencyKey?: string; currentStage: string; stagePayload?: Record<string, unknown>; consolidatedPayload?: Record<string, unknown>; status?: string; submitStatus?: string }): Promise<{ draft: OrganizationProvisioningDraft; idempotencyKey: string }> =>
        ownerApiFetch("/owner/organization-drafts", { method: "POST", body: JSON.stringify(data) }),
      getOrganizationDraft: async (idempotencyKey: string): Promise<{ draft: OrganizationProvisioningDraft }> => ownerApiFetch(`/owner/organization-drafts/${encodeURIComponent(idempotencyKey)}`),
      getOrganizationOperationalState: async (organizationId: string): Promise<ConsolidatedOperationalResponse> => ownerApiFetch(`/owner/organizations/${encodeURIComponent(organizationId)}/operational-state`),
      getWorkerQueuesObservability: async (): Promise<WorkerHealthAggregate> => ownerApiFetch("/owner/system/worker-queues"),
      createOrganization: async (data: CreateOwnerOrganizationInput): Promise<CreateOwnerOrganizationResponse> =>
        ownerApiFetch("/owner/organizations", {
          method: "POST",
          body: JSON.stringify(data),
        }),
    }),
    [ownerApiFetch],
  );
};
