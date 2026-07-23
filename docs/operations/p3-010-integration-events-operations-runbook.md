# P3-010 integration events and operation resources runbook

## Architecture

P3-010 provides one shared foundation: IntegrationEvent v1, PostgreSQL transactional outbox, PostgreSQL inbox receipts, durable DLQ/reconciliation records, and `operational_operations` as the canonical long-running operation resource. Existing `authorization_outbox_events` history is preserved as a compatibility primitive; new shared events use `integration_outbox_events`.

## Deployment order

Apply migrations, run schema guards, start dispatchers, then start consumers. Dispatchers claim with leases and publish through the IntegrationEventTransport port. Consumers validate schema/tenant/consumer contract, reserve inbox receipt, apply the idempotent effect, write audit/resulting outbox when needed, then mark processed.

## Retry, DLQ and reconciliation

Retryable transport failures use bounded backoff and attempts. Terminal/security failures move to durable DLQ. Manual replay requires explicit approval, actor, reason, expected version and tenant scope. Dry-run reconciliation scripts must be used before mutation.

## Rollback

Rollback application code without deleting receipts or DLQ. Do not mark all events published, re-execute all events, disable tenant validation, skip schema validation or increase retries without bound. Prefer forward-fix and reconciliation for uncertain external effects.

## Alerts

Alert on old pending outbox events, expired leases, DLQ growth, stuck inbox receipts, operation resources running too long, tenant mismatch, schema incompatibility and payload redaction rejections.
