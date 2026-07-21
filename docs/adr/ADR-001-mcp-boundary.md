# ADR-001: MCP Boundary in Civitas

## Status

Accepted

## Context

Civitas integrates external systems and future AI agents. Early designs treated MCP connectors as the primary integration architecture. This creates a risk where AI transport becomes coupled to business domains.

## Decision

MCP is an integration and AI exposure layer, not the Civitas domain architecture.

The ownership model is:

```text
Module
  |
  Capability
  |
  Application Service
  |
  Adapter
  |
  Provider

MCP
  |
  Tool exposure of approved operations
```

## Consequences

Positive:

- business rules remain independent from AI transport;
- REST, events, and MCP share authorization and validation boundaries;
- providers remain replaceable adapters;
- future AI clients do not redefine Civitas domains.

Negative:

- MCP tools require additional contract discipline;
- application services become mandatory execution boundaries.

## Rules

- MCP tools must not contain business logic.
- MCP tools must not bypass authorization.
- MCP schemas must map to approved Civitas operations.
- Provider-specific MCP servers may exist behind adapters when required.

## Scope

This ADR applies to all Civitas modules:

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

Ágora and Plasma integration details are defined separately in their own technical documents.
