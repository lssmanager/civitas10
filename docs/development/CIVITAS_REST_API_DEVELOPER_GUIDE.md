# Civitas REST API Developer Guide

## Goal

This guide turns the REST standard into an implementation workflow. It assumes the modular architecture and canonical authorization model are already understood.

## Golden path for a new operation

### 1. Establish ownership

Record:

- module and capability owner;
- command, query, or read-model intent;
- actor and resource;
- tenant/public/owner surface;
- data classification;
- sync or async execution;
- provider dependency;
- produced/consumed events.

Do not start from a URL. Start from the use case and ownership.

### 2. Define stable identities

Choose:

```text
operationId
routeId
actionId
applicationService
permission
```

These names must be provider-neutral and role-neutral.

### 3. Register or reserve the permission

Use the canonical authorization catalog. Keep it `planned` until a real consumer, service, and tests exist. Never activate a permission merely to make a screen visible.

### 4. Define schemas

Add request, response, and problem schemas to the owning module OpenAPI fragment or common components. Define:

- required/optional/null semantics;
- formats and bounds;
- enum compatibility;
- sensitive/write-only fields;
- pagination;
- examples without credentials or personal data.

### 5. Implement command/query service

The application service owns the use case. Inject repositories, provider-neutral ports, authorization/runtime collaborators, outbox, audit, clock, and ID generation explicitly.

### 6. Implement authorization metadata

Declare permission, surface, operation, policies, target/resource resolvers, data-scope needs, module lifecycle, and capability binding. Do not add `if (role === ...)` to controllers.

### 7. Add the HTTP adapter

The router/controller:

- validates path/query/header/body;
- consumes the resolved authorization context;
- invokes the application service;
- maps typed result to the shared envelope;
- maps typed failures to Problem Details.

### 8. Add idempotency/concurrency

For retriable external effects, require `Idempotency-Key`. For governed mutable resources, return `ETag` and require `If-Match` on updates.

### 9. Add events and audit

A mutation transaction should persist domain/operational state, audit record, and outbox event atomically where applicable. The controller never publishes an integration event before the transaction commits.

### 10. Add OpenAPI contribution

Add the path operation and all mandatory `x-civitas-*` metadata. Set status to `planned` until runtime implementation is complete.

### 11. Add tests

Minimum test matrix:

- request/response schema;
- unauthenticated;
- missing permission;
- stale/incomplete policy state;
- cross-tenant ID attack;
- data-scope allow/deny;
- module disabled/suspended/degraded behavior;
- idempotency replay and payload conflict;
- optimistic concurrency failure;
- provider timeout/error normalization;
- audit/outbox behavior;
- no secret leakage;
- OpenAPI/runtime contract agreement.

### 12. Activate deliberately

Move operation and permission to `active` only after implementation, migration, tests, deployment configuration, health behavior, and rollback are ready.

## Router example

```js
router.get(
  '/api/v1/o/:organizationId/lms/courses',
  requireOrganizationAccess,
  requireOrg,
  requirePermission('lms.courses.read'),
  requireAuthorization({
    permission: 'lms.courses.read',
    actionId: 'lms.courses.list',
    surface: 'organization',
    operation: 'read',
    policies: [
      'same-organization',
      'membership-required',
      'authorization-snapshot-current',
    ],
  }),
  validateRequest(listCoursesRequestSchema),
  listCoursesController,
);
```

The example is a target pattern. A permission must be active before mounting the route.

## Controller example

```js
async function listCoursesController(req, res, next) {
  try {
    const result = await req.services.lms.listCourses({
      organizationId: req.org.logto_organization_id,
      principal: req.authorizationDecision.principal,
      page: req.validated.query,
      authorization: req.authorizationDecision,
    });

    return res.status(200).json({
      data: result.items,
      page: result.page,
      meta: { correlationId: req.correlationId },
    });
  } catch (error) {
    return next(error);
  }
}
```

## Asynchronous command example

```text
POST campaign dispatch -> application service records operation/outbox
                        -> 202 + Location
worker consumes job    -> same application boundary
client polls operation -> stable status/read model
```

## Review checklist

A reviewer should reject the PR when:

- URL contains a role or provider;
- controller imports database/provider infrastructure;
- module ownership is ambiguous;
- permission is invented or activated prematurely;
- public operation lacks abuse controls;
- write operation lacks audit;
- critical retryable command lacks idempotency;
- secret appears in config examples/logging;
- reports mutate LMS grades;
- CRM owns marketing campaigns;
- a long-running provider call runs synchronously without justification;
- the OpenAPI and runtime route differ;
- tests do not include cross-tenant denial.

## Definition of Done

The operation is done when its contract, implementation, security, tenant isolation, lifecycle behavior, persistence/adapter behavior, event/audit effects, observability, compatibility, tests, and rollback are all explicit and verified.
