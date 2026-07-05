"use strict";

const CivitasSharedContract = Object.freeze({
  version: "2026-07-civitas-shared-contract-v1",
  logto: Object.freeze({
    issuer: "https://auth.didaxus.com",
    apiResource: "https://civitas.didaxus.com/api",
    managementApi: "https://auth.didaxus.com",
    organizationAudiencePrefix: "urn:logto:organization:",
  }),
  api: Object.freeze({
    publicUrl: "https://civitas.didaxus.com/api",
  }),
  auth: Object.freeze({
    global: Object.freeze({
      ownerRole: "owner_global",
      scopes: Object.freeze({
        ownerRead: "owner:read",
        ownerWrite: "owner:write",
        runtimeRead: "runtime:read",
        runtimeWrite: "runtime:write",
        workerQueuesRead: "worker-queues:read",
        workerQueuesWrite: "worker-queues:write",
        organizationCreate: "organization:create",
        organizationRead: "organization:read",
        organizationWrite: "organization:write",
        impersonationWrite: "impersonation:write",
      }),
    }),
    organization: Object.freeze({
      reservedResource: "organization",
      documentScopes: Object.freeze({ read: "read:documents", create: "create:documents" }),
      roles: Object.freeze({ admin: "organization_admin", member: "organization_member" }),
    }),
    invariants: Object.freeze([
      "single_url_resource_indicator",
      "api_resource_matches_public_api_url",
      "global_tokens_must_not_include_organization_context",
      "organization_tokens_must_stay_organization_scoped",
    ]),
  }),
});

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

module.exports = { CivitasSharedContract, deepClone };
