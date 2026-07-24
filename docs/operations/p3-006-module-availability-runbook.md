# P3-006 ModuleAvailabilityResolver runbook

## Trust boundary

The resolver is the single provider-neutral availability authority. It consumes P3-005 module control-plane primitives, capability primitives, health snapshots, circuit state and degraded policy. It does not grant authorization and does not replace PBAC/ABAC.

## Pre-deploy checks

Run `npm run modules:p3-006:check`, `npm run modules:p3-006:postgres-check`, and `npm run modules:p3-006:resilience-check`. PostgreSQL checks require an isolated `DATABASE_URL`.

## Health and circuit rollout

Health collectors write sanitized `module_health_snapshots`; request/PBAC hot paths read snapshots and circuit state only. Do not probe remote runtimes from the authorization path. Circuit `open` denies; `half_open` allows only explicit probes; closing a circuit never changes module lifecycle.

## Degraded policy

Degraded execution requires explicit policy. Missing policy denies. Read-only policy blocks write/asynchronous/admin operations and never expands permissions.

## Rollback

Rollback application code first, keep health/circuit history, and suspend runtime bindings through P3-005 if execution must stop. Do not mark all modules healthy, extend snapshot TTLs, or disable fail-closed behavior.
