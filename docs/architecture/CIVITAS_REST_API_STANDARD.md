# Civitas REST API Standard

## Status and authority

This is the normative REST standard for Civitas API v1. It applies to all business modules, platform APIs, routers, controllers, OpenAPI fragments, clients, tests, and documentation.

It complements, and does not replace:

- `CIVITAS_AUTHORIZATION_POLICY_MODEL.md` for RBAC/PBAC/ABAC;
- `module-architecture.md` for module and adapter boundaries;
- `module-event-contracts.md` for asynchronous integration;
- `ADR-001-mcp-boundary.md` for MCP;
- `ADR-002-rest-api-boundary.md` for the accepted REST decision.

When examples in older documents conflict with this standard, this standard and the authorization model prevail.

---

## 1. Canonical REST boundary

REST is the synchronous delivery surface for human applications, mobile clients, administrative clients, and system integrations. HTTP controllers translate transport concerns into commands or queries, invoke an application service, and translate the result into the public contract.

```text
request -> authentication -> organization context -> authorization
        -> request validation -> application command/query
        -> repository or provider-neutral port -> result/event/audit
        -> HTTP presenter
```

REST is not the domain layer, module registry, adapter runtime, authorization engine, or inter-module bus.

Forbidden:

- controller to raw provider SDK;
- controller to another module's controller;
- controller to public REST loopback;
- MCP tool to public REST loopback;
- UI route used as an integration contract;
- provider payload returned as a canonical Civitas response.

---

## 2. Documentation hierarchy

The contract is split deliberately:

1. ADRs freeze durable decisions.
2. Architecture standards define mandatory semantics.
3. Developer guides explain the implementation path.
4. OpenAPI describes executable HTTP contracts.
5. Module manifests reference owned operations.
6. Validators enforce consistency.
7. Generated inventories expose traceability.

Markdown is not a substitute for schemas. OpenAPI is not a substitute for architectural rationale. Both are required.

---

## 3. OpenAPI as executable contract

Civitas maintains one composed API document under `contracts/openapi/civitas-api.yaml` with references to common components and module fragments.

Each operation must declare:

```yaml
operationId: lmsCoursesList
x-civitas-module: lms
x-civitas-capability: lms.courses
x-civitas-route-id: lms.courses.list
x-civitas-action-id: lms.courses.list
x-civitas-surface: organization
x-civitas-status: planned
x-civitas-permission: lms.courses.read
x-civitas-policies:
  - same-organization
  - membership-required
x-civitas-audit: read
x-civitas-idempotency: forbidden
x-civitas-execution: synchronous
```

`planned` operations may document the target contract but must not be mounted as active runtime operations until permissions, services, tests, and implementation exist.

---

## 4. Canonical route families

### Organization surface

```text
/api/v1/o/{organizationId}/{module}/{resource}
```

Organization identity is explicit. The authenticated organization context and requested organization must match. A global owner operation uses the owner surface instead of impersonating an organization route silently.

### Owner surface

```text
/api/v1/owner/organizations/{organizationId}/...
```

Owner operations manage catalog, provisioning, ceilings, module lifecycle, operational state, and governed platform configuration.

### Account surface

```text
/api/v1/account/...
```

Account routes operate on the authenticated subject and do not accept arbitrary user IDs unless a separate privileged operation exists.

### Public surface

```text
/api/v1/public/...
```

Public means explicitly governed anonymous or signed-token access. Every public operation declares tenant resolution, abuse controls, rate limits, data exposure, and idempotency.

### Webhook surface

```text
/api/v1/webhooks/{provider}/{eventFamily}
```

Provider names are acceptable here because this is a technical ingress boundary. Provider payloads are verified, normalized, and passed into a canonical application command/event.

---

## 5. Single module ownership

Every operation, resource, aggregate, event, and read model has exactly one owning business module.

The initial module owners are:

- `lms`: courses, enrollment, activities, assessments, grades, progress;
- `crm`: contacts, relationships, segments, admissions/commercial relationship state;
- `marketing`: campaigns, journeys, dispatches, channel publication;
- `community`: groups, feed, participation, recognition;
- `payments`: checkout, invoices, payment state, treasury-facing projections;
- `hr`: employees, leave, payroll orchestration;
- `scheduling`: availability, timetable, sessions, bookings;
- `support`: tickets, replies, assignment, intake normalization;
- `analytics`: measurements, signals, analytical queries;
- `reports`: generated artifacts and composed institutional read models.

Frozen conflict resolutions:

- campaigns belong to `marketing`, not CRM;
- grades and grade mutations belong to `lms`;
- reports may project grades but never modify them;
- communications and notifications are shared transport capabilities or module-owned channels, not new business modules;
- connectors/adapters are platform administration, not business modules.

---

## 6. Resource and process naming

Routes use plural resource nouns and stable identifiers.

Good:

```text
/courses/{courseId}
/courses/{courseId}/enrollments
/campaigns/{campaignId}/dispatches
/leaves/{leaveId}/approval-decisions
/payroll-runs
```

Forbidden:

```text
/teacher-view
/parent-dashboard-data
/processPayroll
/sendCampaign
/moodleCourses
```

Business actions that need identity, lifecycle, retry, audit, or queryability are modeled as resources. A command-style suffix is allowed only when a real resource representation would be artificial and the architecture review approves it.

---

## 7. Queries, commands, and read models

Civitas does not require full CQRS, but it separates intent.

- `GET` performs a query and has no domain side effects.
- `POST` creates a resource or submits a process command.
- `PUT` replaces the complete client-controlled representation and is uncommon.
- `PATCH` performs a documented partial update.
- `DELETE` represents permitted deletion; archival or cancellation is modeled explicitly when history must remain.

Complex dashboards use named read models rather than role-shaped endpoints:

```text
/lms/course-overviews/{courseId}
/analytics/organization-overviews/current
/reports/executive-summaries/current
```

The read model name expresses business meaning. Authorization decides which principals may retrieve it.

---

## 8. Stable operation identity

Every operation has these stable identifiers:

- `operationId`: OpenAPI/client identity;
- `routeId`: backend route inventory identity;
- `actionId`: authorization and UI action identity;
- `moduleId` and `capabilityId`;
- canonical permission;
- application service name;
- audit category.

Recommended naming:

```text
operationId: lmsCoursesList
routeId: lms.courses.list
actionId: lms.courses.list
permission: lms.courses.read
applicationService: listCourses
```

Renaming any stable identifier is a compatibility change and requires migration analysis.

---

## 9. Permission and lifecycle status

Documentation must distinguish:

- `proposed`: architecture discussion only;
- `planned`: reserved contract, not executable;
- `active`: implemented, authorized, tested, and mounted;
- `deprecated`: supported temporarily with replacement metadata;
- `removed`: unavailable in the declared API version.

An active route must reference an active canonical permission. A planned route may reference a planned permission but must not be mounted. No document may present invented permission names as currently operational.

Module lifecycle and authorization are independent:

```text
module/capability available
AND canonical permission effective
AND PBAC policies pass
AND ABAC/data scope passes
= operation may execute
```

---

## 10. Authorization chain

Organization operations follow this logical chain:

```text
authenticate
-> validate audience/resource
-> resolve organization access
-> require canonical organization context
-> verify module lifecycle and capability availability
-> require active permission
-> evaluate server-declared PBAC/ABAC policies
-> verify entitlement/seats when applicable
-> execute application service
-> write audit/outbox atomically when required
```

Rules:

- never authorize from a role string inside a controller;
- never trust organization IDs from body without route/context reconciliation;
- load tenant ownership before returning resource details;
- do not borrow permission from one role path and scope from another;
- fail closed on stale, ambiguous, or incomplete policy state;
- use stable decision IDs and reason codes.

---

## 11. Success representation

A single resource response uses:

```json
{
  "data": {
    "id": "course_01J..."
  },
  "meta": {
    "correlationId": "req_01J..."
  }
}
```

A collection uses:

```json
{
  "data": [],
  "page": {
    "nextCursor": "opaque",
    "hasMore": false
  },
  "links": {},
  "meta": {
    "correlationId": "req_01J..."
  }
}
```

Representations use canonical Civitas field names. Provider-specific fields may exist only under a documented, namespaced `extensions` object and must never be required for normal clients.

Timestamps use RFC 3339 UTC. Dates without time use `YYYY-MM-DD`. IDs are opaque strings. Monetary values use integer minor units plus ISO currency.

---

## 12. Error representation

Errors use `application/problem+json` and RFC 9457 semantics.

```json
{
  "type": "https://civitas.didaxus.com/problems/permission-denied",
  "title": "Permission denied",
  "status": 403,
  "detail": "The principal cannot perform this operation.",
  "instance": "/api/v1/o/org_123/lms/courses/course_456",
  "code": "permission_missing",
  "correlationId": "req_01J...",
  "decisionId": "authz_01J..."
}
```

Stable error codes are machine contracts. Human messages may improve without changing the code.

Never return stack traces, SQL, credentials, raw provider bodies, internal hostnames, or existence details for resources outside the authorized tenant.

Status guidance:

- `400`: malformed request or missing required context;
- `401`: authentication required/invalid;
- `403`: authenticated but not authorized or tenant suspended;
- `404`: resource not visible or absent within the authorized boundary;
- `409`: state/idempotency conflict;
- `412`: optimistic concurrency failure;
- `422`: schema-valid JSON with semantic validation errors;
- `429`: rate limit;
- `500`: unexpected internal failure with safe problem body;
- `502/503/504`: governed dependency failure/unavailability/timeout.

---

## 13. Pagination, filters, sorting, and fields

Cursor pagination is the default for growing operational collections. Offset/page pagination is permitted only for bounded administrative catalogs.

Every collection declares:

- default and maximum page size;
- stable deterministic sort;
- allowlisted filters;
- cursor semantics;
- whether total count is available and its cost.

Clients cannot submit raw SQL, arbitrary field paths, regexes, or provider query languages.

Sparse fieldsets and ad hoc `include` expansion are not enabled globally. A module may add them only with bounded cost, security review, and OpenAPI documentation.

---

## 14. Idempotency and optimistic concurrency

`Idempotency-Key` is required for commands that may be retried and cause external or irreversible effects, including checkout, booking, enrollment batches, campaign dispatch, payroll runs, provisioning, imports, and provider mutations.

Idempotency scope:

```text
organization + authenticated client/principal + operationId + key
```

Reusing a key with a different request fingerprint returns `409 Conflict`.

Mutable high-value resources use `ETag` and `If-Match`. Stale updates return `412 Precondition Failed`. Last-write-wins is prohibited for grades, invoices, payroll, module bindings, authorization configuration, and other governed records.

---

## 15. Asynchronous operations

Long-running work returns:

```http
202 Accepted
Location: /api/v1/o/{organizationId}/operations/{operationId}
```

Operation states are:

```text
accepted, queued, running, succeeded, partially_succeeded,
failed, cancelled
```

The operation resource exposes safe progress, timestamps, result references, error codes, and correlation ID. Controllers do not perform long provider synchronization inline. Workers execute through application services and preserve an initiating or auditable system principal.

---

## 16. Adapter configuration and secrets

Canonical business routes never expose provider credentials.

Adapter administration separates:

- public/non-secret validated configuration;
- adapter type and contract version;
- opaque `secretsRef`;
- health and diagnostic summaries;
- technical mappings.

Secret inputs are `writeOnly`, immediately stored behind the secret boundary, redacted from logs, never returned, and rotated through dedicated operations. General JSON metadata must not become a secret store.

---

## 17. Module implementation boundary

Recommended shape:

```text
backend/modules/<module>/
  domain/
  application/commands/
  application/queries/
  application/ports/
  infrastructure/repositories/
  infrastructure/adapters/
  api/http/controllers/
  api/http/schemas/
  api/http/presenters/
  events/
  tests/
```

Allowed dependency direction:

```text
delivery -> application -> domain/ports <- infrastructure
```

A folder does not create modularity. Import boundaries, ownership metadata, contract tests, and CI provide enforcement.

---

## 18. Shared platform APIs

Shared capabilities are not business modules. Modules consume governed platform APIs for:

- authorization and organization context;
- audit and correlation;
- events/outbox/inbox;
- tasks and operations;
- files and storage;
- secrets;
- health and observability;
- cache;
- localization/time;
- preferences;
- communication transport;
- privacy and retention;
- idempotency and concurrency.

A module must not implement a private alternative to a shared platform concern without an ADR.

---

## 19. Validation and CI gates

CI must fail on:

- missing final newline, CRLF, or trailing whitespace in governed text files;
- invalid or duplicate `operationId`;
- tenant path without `/o/{organizationId}`;
- role or provider names in canonical business paths;
- unknown module/capability ownership;
- active operation with missing/unknown/non-active permission;
- write operation without audit metadata;
- critical retryable operation without idempotency;
- collection without bounded pagination;
- public operation without explicit public policy metadata;
- secrets not marked `writeOnly` or examples containing credentials;
- cross-module ownership conflicts;
- OpenAPI reference drift;
- operation metadata not represented in route/action catalogs.

Validators begin as deterministic repository checks and evolve toward AST/OpenAPI parsing as the runtime implementation lands.

---

## 20. Migration and final freeze

Existing routes are inventoried with current path, canonical path, middleware, permission, policies, legacy behavior, and migration status. Compatibility aliases must be explicit and temporary.

The final frozen statement is:

> Civitas API v1 uses REST as its canonical synchronous surface. Routes are organized by surface, explicit organization, module, and resource; never by role or provider. Every operation is owned by one module and references a capability, stable identities, canonical authorization, schemas, lifecycle, audit, idempotency, and an application service. OpenAPI is the executable contract. Controllers are thin adapters. Internal module collaboration uses application interfaces or versioned events. GraphQL is outside v1 and requires a separate ADR.
