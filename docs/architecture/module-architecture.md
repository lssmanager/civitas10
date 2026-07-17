# Civitas module architecture

## Status

Accepted architecture foundation. Runtime implementation, database migrations, provider adapters, module manifests, and module APIs remain follow-up work.

## Purpose

Civitas is a multi-tenant platform core. It owns organization context, authorization, module activation, capability resolution, operational orchestration, audit, and provider-neutral contracts.

Civitas does not organize the product around MCP servers or external products. It organizes the product around business modules and stable capabilities.

```text
Human frontend ─────── REST API ───────────┐
Internal producers ─── events/webhooks ────┼── application services
AI agents ──────────── MCP tools ──────────┘          │
                                                      ▼
                                              module capabilities
                                                      │
                                                      ▼
                                                adapter runtime
                                                      │
                                                      ▼
                                             external providers
```

REST, event consumers, and MCP are delivery surfaces. They must converge on the same authorization, validation, application-service, audit, and adapter boundaries.

## Architectural invariants

1. **Modules are the product boundary.** A module groups provider-neutral business capabilities, permissions, events, APIs, UI contributions, and adapters.
2. **Capabilities are stable contracts.** Callers request a capability; they do not select or import a provider implementation.
3. **Adapters are replaceable implementations.** Moodle, Mautic, Matomo, Cal.com, Freescout, payment gateways, and future providers remain outside the canonical domain model.
4. **MCP is not the domain layer.** MCP tools expose approved application operations to AI agents. MCP transport and tool schemas must not own business rules.
5. **Organization context is mandatory for tenant operations.** Tenant-scoped resolution is anchored to the canonical Logto organization identifier and Civitas operational bindings.
6. **Authorization is surface-independent.** REST, jobs, event consumers, and MCP tools execute through the same policy decision and permission catalog.
7. **Module activation is tenant-scoped.** Enabling a module for one organization does not enable it globally or for another organization.
8. **Provider details do not leak into stable contracts.** Provider-specific fields belong in adapter configuration, technical mappings, diagnostics, or explicitly namespaced extension objects.
9. **Cross-module behavior uses contracts.** Modules communicate through application interfaces or versioned events, never by importing another module's provider adapter.
10. **The initial module catalog contains exactly ten business modules.** Adding another first-class module requires an explicit architecture decision.

## Initial module catalog

The initial catalog is fixed to these module identifiers:

| Module ID | Civitas responsibility | Boundary notes |
| --- | --- | --- |
| `lms` | Provider-neutral learning administration and runtime integration boundaries exposed by Civitas | Detailed Ágora and Plasma learning-design/runtime semantics are intentionally deferred to dedicated technical documents. |
| `crm` | Contacts, relationship state, segmentation, and admissions/commercial workflows | Provider records are referenced through technical mappings; a provider is not the canonical CRM domain. |
| `marketing` | Campaign and publishing orchestration across approved channels | Social-network and campaign providers are adapters or channels, not modules. |
| `community` | Groups, feed, participation, community interactions, recognition, and community events | Private/formal communication transport must remain behind an approved capability boundary. |
| `payments` | Billing, checkout orchestration, payment status, and treasury-facing operational boundaries | Card or bank secrets must never be stored in module manifests or general organization configuration. |
| `hr` | Employee, payroll-orchestration, and leave-management boundaries | Identity membership in Logto is not duplicated as an HR identity store. |
| `scheduling` | Timetables, synchronous-session orchestration, availability, and booking | Public booking is a separately secured API surface with anti-abuse controls. |
| `support` | Ticket lifecycle and external-intake orchestration | Inbound channel payloads must be normalized before entering the module domain. |
| `analytics` | Acquisition and engagement measurement, signals, and analytical queries | Analytics does not become the canonical source for transactional business state. |
| `reports` | Gradebook projections and institutional report composition | Reports are read models or generated artifacts; they do not own source transactions. |

Identity, authorization, audit, queues, event delivery, secrets, communication transport, file storage, observability, and video transport are platform or shared capabilities unless a later ADR promotes one to a first-class business module. They must not be silently added as an eleventh module.

## Module contract

Every module must eventually publish a machine-readable manifest generated from or validated against a canonical schema. The conceptual contract is:

```ts
type CivitasModuleManifest = {
  id:
    | 'lms'
    | 'crm'
    | 'marketing'
    | 'community'
    | 'payments'
    | 'hr'
    | 'scheduling'
    | 'support'
    | 'analytics'
    | 'reports';
  version: string;
  capabilities: CapabilityDeclaration[];
  permissions: CanonicalPermissionReference[];
  api: ApiContribution[];
  events: EventContribution[];
  adapters: AdapterDeclaration[];
  ui: UiContribution[];
  dependencies: ModuleDependency[];
};
```

The manifest is descriptive and declarative. It must not contain executable provider code, tenant secrets, live provider state, or arbitrary policy expressions.

### Required manifest semantics

A module declaration must identify:

- stable module ID and contract version;
- capabilities it owns;
- references to existing canonical permission names;
- REST operations and MCP tools that expose application operations;
- events it produces or consumes;
- supported adapter types;
- UI routes or navigation contributions, when applicable;
- explicit required and optional dependencies;
- health, audit, and operational-action categories.

The manifest must not invent permissions independently of the canonical permission catalog. A manifest references permissions; the authorization foundation remains authoritative.

## Capability model

A capability is a provider-neutral application contract owned by exactly one module.

Conceptually:

```ts
interface CapabilityResolver {
  resolve(input: {
    organizationId: string;
    moduleId: CivitasModuleId;
    capabilityId: string;
  }): Promise<ResolvedCapability>;
}
```

Resolution must verify, in order:

1. organization context exists and is valid;
2. the module is enabled for the organization;
3. the capability is declared by the module version;
4. the organization has a valid adapter binding when the capability requires one;
5. adapter configuration is complete and secrets are retrievable through the approved secret boundary;
6. the adapter is healthy enough for the requested operation;
7. caller authorization and policy constraints permit the application operation.

A caller must not request `moodle`, `mautic`, `matomo`, or any other provider as the domain capability. It requests `lms.enrollment`, `marketing.campaign`, or another stable capability and receives an implementation selected by Civitas.

## Tenant activation and bindings

The architecture distinguishes three concepts:

- **module catalog:** modules and versions known to the platform;
- **organization module installation:** whether a module is enabled for an organization, plus lifecycle status;
- **adapter binding:** which adapter implements one capability or channel for that organization.

Conceptually:

```text
module_catalog
  └── organization_modules
        └── organization_capability_bindings
              └── adapter configuration reference
```

Disabling a module must prevent new module operations and remove its UI contributions after authorization/navigation resolution. It must not erase provider data, historical audit records, or technical mappings automatically.

Lifecycle states should distinguish at least `disabled`, `provisioning`, `active`, `degraded`, `suspended`, and `decommissioning`. A boolean `enabled` may be retained as a derived or compatibility field, but it is insufficient as the full operational lifecycle.

## Adapter boundary

An adapter implements one or more declared capabilities. It may call an external API, an MCP server, a local service, or a native Civitas implementation. MCP is therefore permitted behind an adapter, but it is not the only adapter transport and it is not exposed as the module's canonical contract.

```ts
interface ProviderAdapter<TCapability> {
  readonly adapterType: string;
  readonly contractVersion: string;
  health(): Promise<AdapterHealth>;
  capability(): TCapability;
}
```

Adapters must:

- normalize provider errors into canonical application errors;
- apply timeouts, retries, circuit-breaking, and idempotency where appropriate;
- emit audit-safe operational telemetry;
- keep credentials outside logs, manifests, events, and API responses;
- isolate provider identifiers in technical mappings;
- declare supported contract versions and capability limits;
- reject unsupported operations instead of silently degrading semantics.

## Application-service boundary

The application-service layer is the single execution boundary for human, system, and AI callers.

```text
REST controller ───────┐
event consumer ────────┼── authorization + validation + application service
MCP tool handler ──────┘                         │
                                                ▼
                                      capability resolver + adapter
```

A REST controller must not call an MCP tool. An MCP tool must not be required to call the public REST endpoint. Both may call the same application service in-process or through an explicitly designed internal boundary.

This prevents transport loops, duplicated validation, inconsistent authorization, and accidental exposure of human-only API behavior to autonomous agents.

## Authorization and policy

The canonical middleware order remains:

```text
requireAuth → requireOrg → requirePermission(permission) → requireSeats → handler
```

Equivalent controls are required for non-HTTP surfaces:

- MCP tool execution resolves the authenticated principal, organization, permission, policy, and delegated scope before the application service runs;
- event consumers use a system principal and an explicit event-consumer policy, not an authorization bypass;
- background jobs preserve the initiating principal or record a separately auditable system actor;
- public endpoints use dedicated public policies, rate limits, abuse controls, and narrowly scoped application services.

Module activation never grants permission. Permission never activates a module. Both conditions must be satisfied.

## UI and navigation contributions

A module may contribute routes and navigation metadata, but the visible UI is derived from all of these conditions:

```text
module active
AND route contribution valid
AND organization context valid
AND permission granted
AND policy/data scope satisfied
AND feature lifecycle allows exposure
```

Module manifests must not directly mutate the sidebar. They contribute validated metadata to the existing screen/action registry and navigation topology.

## Cross-module collaboration

Cross-module workflows must use one of these boundaries:

1. a synchronous provider-neutral application interface where immediate consistency is required;
2. a versioned domain/integration event where eventual consistency is acceptable;
3. an orchestration service in Civitas when one business operation coordinates multiple modules.

Forbidden patterns include:

- importing another module's adapter;
- querying another provider's database directly;
- using UI routes as integration contracts;
- treating webhook payloads as canonical events without normalization;
- sharing unrestricted provider credentials between modules;
- creating circular synchronous dependencies between modules.

## Event contribution rules

Event names use a module-owned namespace, for example:

```text
scheduling.booking.created.v1
payments.checkout.completed.v1
lms.activity.completed.v1
community.post.created.v1
```

An event contract must define producer, semantic version, payload schema, tenant identifier, event identifier, occurrence time, actor/system context, correlation identifier, sensitivity classification, and replay/idempotency expectations.

Provider webhook payloads are inputs to an adapter. They are not emitted unchanged as Civitas events.

## Suggested repository shape

The final implementation may evolve, but module ownership should remain recognizable:

```text
backend/
  modules/
    lms/
    crm/
    marketing/
    community/
    payments/
    hr/
    scheduling/
    support/
    analytics/
    reports/
  platform/
    module-registry/
    capability-resolver/
    adapter-runtime/
    events/
    authorization/
    audit/
```

The physical layout is subordinate to the contracts. A folder named `modules` does not by itself provide modularity; dependency rules and contract tests must enforce the boundary.

## Failure and security model

The module foundation must fail closed when:

- organization context is absent or ambiguous;
- the module is disabled, suspended, or not provisioned;
- a capability or adapter contract version is incompatible;
- permission or policy evaluation is incomplete;
- required adapter configuration is missing;
- secrets cannot be resolved securely;
- a public or agent request exceeds its allowed scope;
- provider response data cannot be validated.

Operational responses may expose stable error codes and correlation identifiers. They must not expose access tokens, provider secrets, raw webhook signatures, internal stack traces, or unrestricted provider payloads.

## Implementation sequence

This document does not authorize simultaneous implementation of all modules. The safe order is:

1. module manifest schema and ten-module catalog;
2. organization-module lifecycle contract;
3. capability and adapter interfaces;
4. authorization integration and audit envelope;
5. API and event contract validation;
6. one vertical reference module and adapter;
7. contract tests that every later module must pass;
8. incremental activation of the remaining modules.

Ágora and Plasma receive separate technical specifications later. This document only reserves the provider-neutral Civitas boundaries required to integrate them without coupling the Civitas core to their future internal design.