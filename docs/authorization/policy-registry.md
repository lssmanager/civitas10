# Phase 2 #89 backend policy registry

## Execution order

The backend policy layer runs after #88/#75 have verified the JWT, token type, audience, organization context, and canonical scope. A scope is necessary and can never be recovered by a policy. The runtime order is:

1. #75/#88 authentication and scope guard.
2. `authorize()` validates the permission against the #74 active catalog.
3. Surface and role-path candidates are built from the verified context.
4. Required contextual policies run with AND composition.
5. Extension policies for #94/#95/#91/#100 can use the same registry interface.
6. The application service performs side effects only after ALLOW.

## Registering policies

Policies are CommonJS modules with `{ id, version, requiredFacts, supportedSurfaces, evaluate }`. Register them through `createPolicyRegistry().registerPolicy()` during startup and freeze the registry before request handling. Duplicate IDs, missing versions, missing evaluators, and unsupported surfaces fail closed.

## Provider ports

Providers are injected into `authorize()` / `requireAuthorization()` and are responsible for facts only: membership, resource ownership, delegation, entitlement, data scope, feature flags, connector state, seat availability, and audit readiness. Providers must not call Logto Management API on request path, must not mutate state, and must fail closed when unavailable.

## Core policies implemented in Phase A

- `same-organization`
- `resource-belongs-to-organization`
- `membership-required`
- `target-role-delegable`
- `cannot-escalate-privileges`
- `cannot-modify-owner-global`
- `critical-operation-audited`
- `connector-enabled`
- `seat-availability`
- `feature-enabled`

Owner impersonation and extension policies are registered as interfaces/fail-closed adapters until #90/#94/#95/#100 provide the real runtime data.


## Endpoint policy inventory for Phase A

| routeId | method | path | permission | current guards | required policies | resourceLoader | surface | migrationState |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `documents.read` | GET | `/documents` | `org.documents.read` | `requireOrganizationAccess`, `requireOrg`, `requireOrganizationRole`, `requirePermission`, `requireAuthorization` | `same-organization`, `membership-required` | token/tenant context only | organization | pilot migrated for #78 pattern |
| `documents.create` | POST | `/documents` | `org.documents.create` | `requireOrganizationAccess`, `requireOrg`, `requireOrganizationRole`, `requirePermission`, `requireAuthorization` | `same-organization`, `membership-required`, `critical-operation-audited` | token/tenant context + audit intent | organization | pilot migrated for #78 pattern |
| `role-assignment.assign` | future | `/o/:organizationId/...` | candidate `org.members.roles.assign` | #75 scope guard + #89 policy engine | `same-organization`, `membership-required`, `target-role-delegable`, `cannot-escalate-privileges`, `cannot-modify-owner-global`, `critical-operation-audited` | #92 delegation provider + future membership/resource providers | organization | blocked until active route/permission contract exists |

## Route declaration pattern for #78

Pilot tenant routes use the pattern:

```js
requireOrganizationAccess(...),
requireOrg,
requireOrganizationRole(...),
requirePermission("org.documents.read"),
requireAuthorization({
  permission: "org.documents.read",
  surface: "organization",
  operation: "read",
  policies: ["same-organization", "membership-required"],
})
```

Policy IDs are declared server-side. They are never accepted from body or query parameters.

## Role-path provenance

Each decision preserves role paths with `rolePathId`, `logtoRoleId`, scope presence, delegation result, and per-policy results. A final ALLOW can match one complete path; permission fragments from one role are not combined with delegation or data-scope fragments from another role.

## Fail-closed and side-effect boundary

`authorize()` is read-only. It does not assign roles, mutate DB, publish events, call connectors, start impersonation, or write definitive audit logs. Critical operations require an audit intent before side effects; the service writes DB/audit/outbox after ALLOW.

## Impersonation status

Tenant impersonation remains disabled: legacy `org.impersonate` and `impersonation:write` remain invalid, and `org.impersonation.execute` is still planned in #74. Owner impersonation policies are registered as fail-closed interfaces until #90 completes TTL, reason, revocation, actor/effective, audit, and rate-limit contracts.

## Diagnostics

Public HTTP responses expose only `{ error, code, decisionId }`. Detailed `evaluatedRolePaths` stay server-side for protected diagnostics and tests; decisions and reason codes do not include bearer tokens, full claims, secrets, connector configuration, or PII.

## Pending integrations

- #78 should apply the pilot route pattern to tenant routes.
- #94 should provide entitlement and snapshot providers.
- #95 should provide data-scope providers.
- #91 should provide feature flag storage/provider.
- #100 should replace the fail-closed seat request policies.
- #101 should provide policy version and snapshot semantics.
