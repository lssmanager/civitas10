# ADR-002: REST API boundary for Civitas v1

- **Status:** Accepted for the Civitas modular foundation.
- **Date:** 2026-07-17.
- **Scope:** Synchronous application delivery for web, mobile, administrative clients, and system integrations.
- **Supersedes:** Any interpretation that makes MCP, provider APIs, UI routes, or role-specific endpoints the canonical business API.

## Context

Civitas is evolving into a multi-tenant modular platform with ten business modules, shared platform capabilities, provider-neutral application services, replaceable adapters, versioned events, and an optional MCP surface for AI agents. The repository already has an Express runtime, canonical organization paths, active-permission guards, PBAC/ABAC policy evaluation, audit concepts, an operational database, and route/navigation contracts.

Without a frozen API boundary, each module could independently choose URLs, envelopes, pagination, errors, tenant resolution, authorization, provider exposure, and asynchronous execution. That would recreate a distributed monolith of incompatible routers.

## Decision

REST is the canonical synchronous API surface for Civitas API v1.

```text
Web / mobile / system client
          |
       REST API
          |
  application service
          |
 module capability / domain
          |
 repository or provider-neutral port
          |
 adapter / persistence / external provider
```

MCP tools, workers, event consumers, and REST controllers are delivery adapters over the same application services. They do not call each other as an internal integration mechanism.

## Frozen rules

1. Public versioned routes start with `/api/v1`.
2. Tenant routes use `/api/v1/o/{organizationId}/...`; organization identity is explicit and must match the authenticated context.
3. Owner, organization, account, public, and webhook surfaces are distinct.
4. Routes represent resources, capabilities, or business processes, never roles or provider products.
5. Controllers are thin transport adapters and do not contain domain rules.
6. Controllers do not import Drizzle tables, raw SQL helpers, or provider SDKs directly.
7. Modules communicate synchronously through provider-neutral application interfaces and asynchronously through versioned events.
8. Every operation has stable `operationId`, `routeId`, `actionId`, module, capability, schemas, security, audit, and lifecycle metadata.
9. Every tenant operation is authorized by the canonical Civitas authorization model; UI visibility is never sufficient.
10. Public operations declare explicit public policies; `permission: null` is not a security model.
11. Long-running commands return `202 Accepted` and an operation resource.
12. Critical retriable commands require idempotency.
13. Mutable resources use optimistic concurrency where lost updates would be unsafe.
14. Errors use RFC 9457 Problem Details with stable Civitas codes.
15. OpenAPI is the executable public contract. Markdown explains rationale and implementation rules.
16. GraphQL is not part of Civitas API v1. Introducing it requires a separate ADR and demonstrated read-composition need.
17. Provider-specific names are allowed only at provider technical boundaries, such as webhook ingress or adapter administration.
18. Secrets are never returned and are stored only behind opaque secret references.
19. Breaking public changes require a new API major version or an explicitly versioned compatibility path.
20. CI must reject drift between OpenAPI, route inventory, permissions, module ownership, and implementation metadata.

## Consequences

### Positive

- One predictable API model across ten modules.
- Explicit tenant isolation and security contracts.
- Replaceable providers without leaking provider vocabulary.
- Stable clients and generated documentation.
- Contract validation before runtime regressions.
- REST and MCP converge on one application layer.

### Costs

- More metadata and validation are required for each operation.
- Existing ad hoc routes need staged migration.
- Permission catalogs and module manifests must become executable sources of truth.
- OpenAPI ownership and compatibility review become mandatory engineering work.

## Rejected alternatives

### Endpoints per role

Rejected because roles are authorization inputs, not resource identities. `/teacher-view` and `/parent-view` couple URLs to presentation and bypass PBAC/ABAC semantics.

### Provider-shaped APIs

Rejected because `/moodle/*`, `/matomo/*`, or `/mautic/*` would make external implementations canonical product boundaries.

### GraphQL as the authorization or navigation layer

Rejected because query composition does not replace screen contracts, tenant isolation, permissions, policies, or data scopes.

### Internal module-to-module HTTP

Rejected for the current modular monolith because it adds network semantics, duplicated authentication, and failure modes without an actual deployment boundary.

## Compliance

This ADR is enforced by:

- `docs/architecture/CIVITAS_REST_API_STANDARD.md`;
- `docs/architecture/CIVITAS_MODULE_HTTP_CONTRACT.md`;
- `contracts/openapi/civitas-api.yaml`;
- `scripts/api/validate-api-contract.mjs` and companion validators.
