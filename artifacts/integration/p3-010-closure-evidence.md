# P3-010 closure evidence

- Branch: `codex/issue-180-integration-events-outbox-operations`
- Base/P3-006 SHA: `e8d361feeab6d7d2506f7283ecafb8138d0b285d`
- origin/main: `141ac39df5e199e7bef99a6959a9f3563c15961a`
- merge-base: `141ac39df5e199e7bef99a6959a9f3563c15961a`
- Migration: `0020_integration_events_operations.sql`
- Event schema hash: `173705bcab99bf1e10bd2906eb2c78e1a520200666b56706224ff5b9aa23b9c5`
- Event registry hash: `ad1a6690ce1a2d8e5827f33dc58bd801bc85bbad57d9e9210dfbca95ef831685`

## Evidence

- Outbox adapter: PostgreSQL `integration_outbox_events` with unique event ID, leases, attempts and DLQ transitions.
- Inbox adapter: PostgreSQL `integration_inbox_receipts` with unique `consumer_id + event_id`.
- Operation repository: extended `operational_operations` with canonical operation states and optimistic version transitions.
- Transport: shared `IntegrationEventTransport` port; dispatcher marks published only after ack.
- Redaction: recursive payload safety validator and redaction gate reject tokens, secrets, blobs and raw provider responses.
- Reconciliation: dry-run CLI family inspects outbox/inbox/DLQ/operations without printing payloads.
