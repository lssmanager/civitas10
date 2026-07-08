# Owner Capability Surfaces

Civitas owner APIs are capability-first. The public owner contract is organized around stable product capabilities such as `crm`, `marketing`, `lms`, `community`, `payments`, `notifications`, `support`, `analytics`, and `scheduling`.

Providers are implementation details behind adapters. A provider name such as FluentCRM or Moodle may appear as `adapter.key`, `adapter.label`, `metadata.provider`, or documented legacy compatibility metadata, but it must not define the root structure of owner payloads.

## Canonical shape

Every organization-facing capability card should expose the same minimum fields:

```json
{
  "capability": "crm",
  "label": "CRM",
  "configured": true,
  "adapter": {
    "key": "fluentcrm",
    "label": "FluentCRM",
    "status": "available"
  },
  "health": {
    "status": "healthy",
    "lastCheckedAt": "2026-07-07T10:00:00.000Z",
    "message": null
  },
  "runtimeState": {
    "source": "organization_runtime_state",
    "summary": {
      "companyId": "company_123"
    }
  },
  "blockers": [],
  "nextActions": []
}
```

## Field semantics

- `capability` is the stable public key and must be validated against the canonical capability catalog.
- `configured` means the organization has an active connector binding for the capability.
- `adapter` is a secondary implementation detail. It can identify the active adapter but must not become the payload root.
- `health.status` is owner-facing operational state: `healthy`, `degraded`, `unhealthy`, `not_configured`, or `unknown`.
- `runtimeState` comes from `organization_runtime_state` when available. Legacy Logto `customData` fallback must be marked with `source: "legacy_custom_data"` and `legacy: true`.
- `blockers` are operable objects with a stable `code`, `severity`, `message`, scope, and capability when relevant.
- `nextActions` tell the owner what can be done next, for example `configure_connector`, `retry_health_check`, `resolve_credentials`, `view_operation`, `reconcile_runtime_state`, or `contact_support`.

## Not configured is expected

A capability can be intentionally unconfigured. Owner surfaces must represent that as an informational state, not as a critical error:

```json
{
  "capability": "lms",
  "configured": false,
  "adapter": null,
  "health": {
    "status": "not_configured",
    "lastCheckedAt": null,
    "message": "No hay adapter configurado para la capacidad LMS."
  },
  "blockers": [
    {
      "code": "connector_not_configured",
      "severity": "info",
      "scope": "organization",
      "capability": "lms"
    }
  ],
  "nextActions": [
    {
      "type": "configure_connector",
      "target": {
        "capability": "lms"
      }
    }
  ]
}
```

## Routes

- `GET /owner/system/registry` returns `{ "capabilities": [...] }` with `availableAdapters` grouped under each capability.
- `GET /owner/organizations/:organizationId/operational-state` returns organization state with `capabilities[]`, top-level aggregate `blockers[]`, and top-level aggregate `nextActions[]`.
- `GET /owner/system/worker-queues` remains technical observability but includes owner-friendly signals with impact and next action; logs or raw queue fields are not the only diagnostic path.

## Legacy compatibility

Provider-named compatibility blocks, if still needed internally, must be nested under an explicit `legacy` object and marked as deprecated. They are compatibility data, not canonical domains. New frontend work should read `capabilities[]` first and should not expand provider-root payloads.
