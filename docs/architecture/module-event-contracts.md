# Civitas module event contracts

## Status

Foundation contract for module communication through versioned events.

## Principles

Modules do not communicate by importing provider adapters.

Allowed boundaries:

1. synchronous provider-neutral application interfaces;
2. versioned domain/integration events;
3. Civitas orchestration services.

## Event model

```text
Module operation
      |
      v
Application Service
      |
      v
Transactional Outbox
      |
      v
Event Dispatcher
      |
      v
Module subscribers
```

## Event naming

Events use module-owned namespaces:

```text
lms.activity.completed.v1
crm.contact.tagged.v1
scheduling.booking.created.v1
payments.checkout.completed.v1
community.post.created.v1
```

## Event envelope

Every event must define:

- event id;
- schema version;
- payload schema;
- producer module;
- aggregate type/id;
- organization id;
- actor/system context;
- correlation id;
- occurred timestamp;
- sensitivity classification;
- replay and idempotency rules.

Each event must define a versioned payload schema that consumers can validate before processing. Producers must not emit events with undocumented payload shapes.

## Security

Events are not authorization bypasses.

Consumers execute with an explicit system principal and policy context.

Provider webhooks are adapter inputs and must be normalized before becoming Civitas events.
