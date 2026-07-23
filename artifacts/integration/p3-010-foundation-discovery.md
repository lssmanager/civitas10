# P3-010 foundation discovery

- Branch: `codex/issue-180-integration-events-outbox-operations`
- Base/P3-006 SHA: `e8d361feeab6d7d2506f7283ecafb8138d0b285d`
- origin/main: `141ac39df5e199e7bef99a6959a9f3563c15961a`
- merge-base: `141ac39df5e199e7bef99a6959a9f3563c15961a`

| Primitive | Decision | Rationale |
| --- | --- | --- |
| authorization_outbox_events | compatibility-adapter | Preserve authorization history while shared IntegrationEvent v1 becomes the envelope-backed foundation. |
| operational_operations | extend | Evolves into canonical operation resource with module/capability/state/version/correlation fields. |
| audit_logs | reference | Reused for transactional audit; no second audit system. |
| integration_outbox_events | extend | Shared transactional outbox with leases, attempts, DLQ transitions and tenant indexes. |
| integration_inbox_receipts | extend | Durable consumer idempotency keyed by consumer + event. |
| integration_dead_letters | extend | Durable governed DLQ/reconciliation state. |
