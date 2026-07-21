# Civitas Module HTTP Contribution Contract

## Purpose

This document defines how a business module contributes HTTP operations without owning the shared HTTP runtime, authorization engine, tenant resolver, error model, or provider infrastructure.

## Contribution model

A module contributes metadata and adapters around an application service:

```ts
export type HttpOperationContribution = {
  moduleId: CivitasModuleId;
  capabilityId: string;
  operationId: string;
  routeId: string;
  actionId: string;
  applicationService: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  surface: 'owner' | 'organization' | 'account' | 'public' | 'webhook';
  status: 'planned' | 'active' | 'deprecated';
  permission?: CanonicalPermissionName;
  policies: readonly PolicyId[];
  requestSchema?: SchemaReference;
  responseSchema: SchemaReference;
  problems: readonly ProblemTypeReference[];
  audit: 'none' | 'read' | 'write' | 'critical';
  idempotency: 'forbidden' | 'optional' | 'required';
  execution: 'synchronous' | 'asynchronous';
  moduleLifecycleRequired: boolean;
  capabilityBindingRequired: boolean;
};
```

## Ownership invariants

- One operation has one module owner.
- One capability has one module owner.
- The module references canonical permissions; it does not define authorization semantics locally.
- Provider names cannot appear in canonical business paths or operation IDs.
- Cross-module reads use an application contract or an owned projection; they do not join another module's provider storage directly.
- Reports own projections/artifacts, not source mutations.
- Analytics owns measurement/query semantics, not transactional truth.

## Surface requirements

### Organization

- path begins `/api/v1/o/{organizationId}`;
- organization context is required;
- same-organization and membership policy requirements are declared where applicable;
- module lifecycle is checked for business modules;
- resource ownership/data scope is resolved before data disclosure.

### Owner

- path begins `/api/v1/owner`;
- global owner authorization is explicit;
- owner operations cannot silently execute as tenant principals;
- mutations are audited and normally require optimistic concurrency.

### Account

- path begins `/api/v1/account`;
- subject is derived from the authenticated principal;
- arbitrary subject IDs require a separate privileged operation.

### Public

- path begins `/api/v1/public`;
- public policy, rate limit, abuse controls, tenant resolution, and exposure limits are mandatory;
- anonymous does not mean ungoverned.

### Webhook

- path begins `/api/v1/webhooks/{provider}`;
- signature/replay verification is required;
- raw payload is normalized before domain use;
- provider details never become canonical event schemas.

## Controller contract

A controller may:

1. read validated transport inputs;
2. read resolved principal/organization/authorization decisions;
3. invoke exactly the intended application command/query;
4. map canonical results to HTTP presenters;
5. forward typed errors to the shared problem mapper.

A controller must not:

- query database tables directly;
- select adapters through arbitrary string lookups;
- implement role checks;
- create business events outside the application transaction;
- log request bodies containing secrets;
- return raw provider responses;
- mutate navigation or permission catalogs.

## Application service contract

The application service receives explicit dependencies and a canonical command/query. It verifies module/capability availability through the shared runtime, applies domain rules, calls repositories/ports, and persists state plus outbox/audit atomically when required.

## Operation registration gates

An operation can become `active` only when:

- the owning module/capability exists;
- its permission is active when required;
- policy and tenant resolvers exist;
- request/response/problem schemas exist;
- an application service and controller exist;
- audit/idempotency/concurrency behavior is implemented;
- OpenAPI and route inventory agree;
- contract, authorization, cross-tenant, and failure tests pass;
- observability emits operation, module, capability, correlation, and decision identifiers.

## Compatibility

Breaking changes include removing/renaming fields, changing meaning, narrowing accepted values unexpectedly, changing ownership, changing identifier format, changing error code semantics, or making a previously optional requirement mandatory. They require versioning or a migration period.
