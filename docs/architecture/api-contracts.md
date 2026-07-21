# Civitas API Contract Architecture

## Purpose

Civitas exposes business capabilities through stable application contracts. REST APIs, events, webhooks, and MCP tools are delivery surfaces over the same module-owned application services.

## Boundary rule

```text
Human UI
   |
 REST API
   |
 Application Service
   |
 Module Capability
   |
 Adapter Runtime
   |
 Provider
```

AI agents use:

```text
AI Agent
   |
 MCP Tool
   |
 Application Service
   |
 Module Capability
```

MCP does not replace REST APIs and does not own business rules.

## API ownership

Each module owns its API contracts:

- lms: courses, enrollments, activities, assessments, progress
- crm: contacts, relationships, segmentation
- marketing: campaigns, publishing orchestration
- community: groups, feed, participation
- payments: billing, checkout, treasury boundaries
- hr: employees, payroll orchestration, leave workflows
- scheduling: timetable, sessions, booking
- support: tickets and normalized intake
- analytics: acquisition and engagement queries
- reports: projections and institutional reports

## Contract requirements

Every API operation must define:

- authentication requirements
- organization scope
- required permissions
- request schema
- response schema
- audit behavior
- idempotency requirements
- error contract
- versioning strategy

## Versioning

Public contracts must be versioned.

Example:

```text
/api/v1/lms/courses
/api/v1/crm/contacts
```

Breaking changes require a new contract version.

## Authorization

All API surfaces use the canonical Civitas authorization chain:

```text
requireAuth → requireOrg → requirePermission(permission) → requireSeats → handler
```

The same policy model applies to REST, events, jobs, and MCP execution.
