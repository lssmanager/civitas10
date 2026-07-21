# Civitas module navigation contracts

## Status

Foundation document for module-driven navigation.

## Existing contracts

Navigation authorization already has established contracts:

- `Visual Access Contract`
- route catalog
- screen/action registry
- `AuthorizationContext`
- navigation validation scripts

This document extends those contracts for modules. It does not create a second navigation system.

## Resolution pipeline

```text
Module Manifest
      |
      v
Route contributions
      |
      v
Screen / Action Registry
      |
      v
Authorization Context
      |
      v
Navigation Topology
      |
      v
AppShell renderer
```

## Rules

A module may contribute:

- screens
- actions
- route metadata
- navigation labels
- required permissions

A module must not:

- mutate the sidebar directly;
- bypass authorization;
- create route permissions outside the canonical catalog;
- expose unavailable tenant modules.

## Visibility decision

A navigation item is visible only when:

```text
module installed
AND module lifecycle allows exposure
AND effective capability availability is valid
AND required adapter/binding availability is valid when required
AND route contract valid
AND organization context valid
AND permission granted
AND policy/data scope allows exposure
AND feature lifecycle allows exposure
```

Navigation is presentation. Authorization remains backend authoritative.

## Tenant behavior

Each organization receives navigation derived from:

- installed modules;
- module UI contributions;
- effective authorization context;
- effective capability availability;
- lifecycle state.

Disabling or decommissioning a module removes navigation exposure but does not delete historical data.

Transitional states such as provisioning, suspended, degraded, or decommissioning must not expose routes that cannot execute successfully.