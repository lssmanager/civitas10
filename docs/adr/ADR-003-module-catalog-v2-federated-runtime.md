# ADR-003: Module Catalog v2 and Federated Module Runtime

## Status

Accepted

## Date

2026-07-22

## Extends

- ADR-001: MCP Boundary in Civitas
- ADR-002: REST API Boundary for Civitas v1

## Related

- #127 Canonical RBAC/PBAC/ABAC operating model
- #144 Modular architecture foundation
- #161 Canonical permission catalog
- #167 Reconciliation
- #174 ADR-003 implementation
- #175 Module Manifest v2
- #200 Phase 3 execution roadmap

---

## Context

Civitas Phase 3 expands the modular foundation from the original ten-module model by introducing `planning` as a new business capability boundary.

The previous architecture treated modules primarily as embedded runtime areas. Phase 3 requires supporting both embedded and federated deployment without breaking:

- canonical authorization;
- REST API ownership;
- module manifests;
- permission catalogs;
- frontend navigation contracts;
- tenant lifecycle;
- auditability;
- CI validation.

Adding a new module by modifying only a TypeScript enum or frontend registry would create drift between contracts.

---

## Decision

Civitas Phase 3 recognizes exactly eleven canonical business modules:

```text
lms
crm
marketing
community
payments
hr
scheduling
support
analytics
reports
planning
```

A module is a stable product ownership boundary. It is not equivalent to:

- a folder;
- a provider;
- a connector;
- a menu entry;
- a deployment unit.

Each module declares a deployment mode:

```text
embedded
federated
```

Deployment mode does not change canonical module identity.

---

## Planning Module Decision

`planning` is the eleventh Civitas business module.

```yaml
moduleId: planning
productSurface: agora
deploymentMode: federated
status: planned
runtimeContractVersion: civitas-module-runtime/v1
serviceIdentityRequired: true
```

Civitas owns:

- identity integration;
- organization context;
- authorization;
- tenant lifecycle;
- public REST API;
- shared MCP exposure;
- AppShell and navigation.

Ágora owns:

- planning domain logic;
- planning transactional data;
- planning workers;
- planning runtime;
- functional planning UI contribution.

The browser MUST NOT call the private Ágora runtime directly.

---

## Module Deployment Modes

### Embedded

The runtime executes within Civitas deployment boundaries.

### Federated

The module runtime is independently deployed but remains governed by Civitas contracts.

A federated module:

- is not a connector;
- does not create a second identity system;
- does not bypass authorization;
- does not define independent permissions;
- does not expose provider-specific canonical IDs.

---

## Initial Module Status

All eleven modules begin with contract status `planned` until promoted by evidence.

Promotion to `active` requires:

- implementation;
- real consumer;
- canonical permissions;
- policies;
- tests;
- deployment;
- observability;
- rollback evidence.

Contract status and tenant installation lifecycle are separate.

Contract status:

```text
proposed
planned
active
deprecated
removed
```

Tenant lifecycle:

```text
disabled
provisioning
active
degraded
suspended
decommissioning
```

---

## Ownership Rules

Every capability, operation, aggregate, event and read model has exactly one canonical owner.

Module manifests MUST declare:

```yaml
moduleId:
businessBoundary:
businessOwner:
capabilityOwnership:
dataOwner:
publicApiOwner:
runtimeOwner:
uiContributionOwner:
deploymentMode:
```

---

## Source of Truth

Civitas maintains one authored catalog.

Generated and validated consumers include:

- backend module types;
- frontend capability types;
- OpenAPI metadata;
- permission catalogs;
- route inventory;
- CI validators.

Historical registries must migrate through explicit mappings. Silent rename or destructive replacement is prohibited.

---

## API Boundary

Public flow:

```text
Browser
  -> Civitas REST API
  -> canonical authorization
  -> module application port
  -> federated runtime contract
```

Forbidden:

- browser to private module API;
- cross-database joins;
- provider names as canonical routes;
- role-shaped endpoints;
- separate authorization engines.

---

## Authorization Boundary

Civitas remains authoritative for:

- canonical permissions;
- RBAC role potential;
- Owner ceilings;
- Tenant activations;
- PBAC;
- ABAC/Data Scope;
- module availability;
- authorization decisions.

Remote runtimes validate execution context and apply local domain invariants only.

Role strings are not authorization authority.

---

## UI Boundary

The user remains inside Civitas AppShell.

Civitas owns:

- header;
- organization context;
- navigation topology;
- breadcrumbs;
- account experience.

Modules contribute versioned UI contracts through the existing screen/action/navigation model.

---

## Data Ownership

| Owner | Data |
|---|---|
| Logto | identity, organizations, memberships, sessions |
| Civitas | authorization, lifecycle, bindings, gateway audit |
| Planning runtime | plans, profiles, roadmaps, assessments, reviews, documents, handoffs |
| LMS | delivery state |
| Plasma | production tasks and assets |

Cross-database joins are prohibited.

---

## Provider Neutral IDs

Canonical IDs MUST remain provider-neutral.

Allowed:

```text
planning
planning.plans
planning.plans.read
```

Forbidden:

```text
agora.plans
moodle.courses
canvas.enrollments
plasma.tasks
```

Provider names may exist only in adapters, mappings, diagnostics or deployment metadata.

---

## Consequences

Positive:

- federated modules without product fragmentation;
- one authorization model;
- one navigation model;
- replaceable runtimes;
- lower provider leakage.

Costs:

- contract versioning;
- inter-runtime compatibility;
- stronger CI validation;
- federated observability;
- migration complexity.

---

## Rejected Alternatives

Rejected:

- Ágora as independent portal with own login;
- Ágora fully absorbed into Civitas backend;
- Planning as Moodle adapter;
- iframe as primary integration;
- browser direct access to remote runtime;
- second permission catalog inside Ágora.

---

## Non Goals

This ADR does not implement:

- planning endpoints;
- active planning permissions;
- runtime credentials;
- mTLS implementation;
- remote UI loader;
- migrations;
- MCP tools;
- LMS integration;
- Plasma handoff.

Those belong to implementation issues after this decision.

---

## Acceptance Criteria

- [x] Eleven canonical modules accepted.
- [x] Planning accepted as module ID eleven.
- [x] Embedded and federated modes accepted.
- [x] Civitas/Ágora ownership boundaries accepted.
- [x] Contract status separated from tenant lifecycle.
- [x] Source of truth strategy accepted.
- [x] Provider-neutral naming enforced.
- [x] Public REST boundary preserved.
- [ ] Federated runtime boundary documented.
