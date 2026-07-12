# Authorization runtime consistency (#101)

This slice adds the shared runtime consistency infrastructure consumed by authorization producers instead of creating per-domain dispatchers or cache contracts.

## Inventory

Reusable baseline components found in the repository:

- `operational_operations`, `operational_operation_steps`, and `idempotency_records` already provide durable operation and idempotency tables.
- `priority_commands` and `background_events` already exist as BullMQ queue names.
- `authorization_policy_versions` already exists from the entitlement overlay and is extended with `visual_version`.
- The #95 `authorization_scope_assignments` table is canonical for explicit and derived data-scope assignments.

Absent or intentionally prepared as ports:

- #91 feature flag storage is not implemented as a complete domain here; `FeatureAvailabilityResolver` consumes a state provider and fails closed.
- #100 billing seat changes are represented as a workflow runtime contract and in-memory test port; provider execution remains blocked until the business contract and connector integration exist.
- This work does not add another organization table, another policy version, or another outbox.

## Runtime contract

`authorization_policy_versions` stores monotonic policy, catalog, and visual versions. Mutations that affect authorization call the runtime outbox service so the state change, version increment, audit summary, and `authorization_outbox_events` row are written in one transaction.

The outbox uses `(event_type, aggregate_type, aggregate_id, event_version)` as the uniqueness boundary because different aggregate namespaces can reuse the same local aggregate ID safely.

Redis keys are versioned and cache-aside only. Old keys become unreachable after the version changes; TTL is a cleanup aid rather than the security boundary.

## #95 target contract

The closed database contract for data-scope assignments remains PostgreSQL-owned:

```sql
CHECK (num_nonnulls(dimension_value_id, unit_id, resource_ref) = 1)
```

Frontend validation is not an integrity boundary. Tenant-scoped taxonomy and unit foreign keys remain in the #95 migration, while external `resource_ref` values must be verified by the capability adapter and runtime reconciler.

## Runtime integrations

- #91: feature availability is `global_enabled AND rollout AND tenant disable-only override AND scope AND entitlement AND policy`; unknown or unavailable state denies.
- #95: assignment lifecycle events use the central runtime outbox and policy version contract; revocation remains fail-closed because reads still validate assignment status and timestamps.
- #100: the seat workflow uses durable idempotency, terminal state checks, approval snapshots without bearer tokens, and worker reauthorization before sensitive apply work. Provider execution remains fail-closed when the connector is unavailable.

## Blockers and rollout risks

- Real #91 storage and admin endpoints still need to be wired to the runtime service when #91 lands.
- Real #100 provider operations need the final business rule for whether approvals are durable decisions or must be revalidated at apply time; the runtime contract currently chooses fail-closed revalidation.
- Existing entitlement code uses a legacy JS-number Drizzle bigint in older tables; new policy-version contracts serialize public versions as strings.
