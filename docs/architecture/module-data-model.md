# Civitas module data model foundation

## Status

Logical data model for future module runtime implementation.

This document defines ownership boundaries. It does not replace concrete migrations.

## Core registries

```text
module_catalog
      |
      |
organization_modules
      |
      |
organization_capability_bindings
      |
      |
adapter_configuration_reference
```

## Module catalog

Defines platform-known modules:

- id
- version
- lifecycle
- manifest reference
- owned capabilities

Initial modules:

- lms
- crm
- marketing
- community
- payments
- hr
- scheduling
- support
- analytics
- reports

## Organization module installation

Tenant scoped lifecycle:

```text
disabled
provisioning
active
degraded
suspended
decommissioning
```

A module installation controls availability, not authorization.

## Capability binding

A tenant binds capabilities to implementations:

```text
organization
   |
capability
   |
adapter
   |
provider
```

Provider identifiers remain technical mappings, not canonical business entities.

## Existing platform data boundaries

Civitas DB owns operational state:

- audit
- synchronization state
- queues
- technical mappings
- connector bindings
- health state
- reconciliation state

Logto remains canonical for identity, organizations, memberships and roles.

## Future module tables

Expected future entities:

- module_catalog
- module_versions
- organization_modules
- capability_registry
- organization_capability_bindings
- adapter_registry
- module_event_subscriptions

Implementation requires versioned migrations and contract tests.