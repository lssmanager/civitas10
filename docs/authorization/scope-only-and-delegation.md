# Phase 2 #75/#92 scope-only backend and delegation limits

## #75 scope-only authorization

Backend functional authorization is now scope-only: a guard grants only when the required canonical permission is present in the verified JWT scope set. Role names remain on `req.auth` and `req.user` for diagnostics, provenance, policy context, and delegation, but they never expand scopes.

### Migrated guard inventory

| File | Route | Method | Previous guard | Canonical permission | Status | Migration state |
| --- | --- | --- | --- | --- | --- | --- |
| `backend/index.js` | `/owner/me` | GET | shared legacy owner read scope + owner surface | `owner.profile.read` | active | migrated |
| `backend/index.js` | `/owner/organization-template` | GET | shared legacy organization read scope + owner surface | `owner.organizations.read` | active | migrated |
| `backend/index.js` | `/owner/organizations` | GET | shared legacy organization read scope + owner surface | `owner.organizations.read` | active | migrated |
| `backend/index.js` | `/owner/organization-drafts` | POST | shared legacy organization create scope + owner surface | `owner.organizations.create` | active | migrated |
| `backend/index.js` | `/owner/organizations/:organizationId/operational-state` | GET | shared legacy owner/runtime read scopes + owner surface | `owner.profile.read`, `owner.runtime.read` | active | migrated |
| `backend/index.js` | `/owner/system/worker-queues` | GET | shared legacy worker queues read scope + owner surface | `owner.worker_queues.read` | active | migrated |
| `backend/index.js` | `/owner/system/registry` | GET | shared legacy runtime read scope + owner surface | `owner.runtime.read` | active | migrated |
| `backend/index.js` | `/owner/system/operations` | POST | shared legacy runtime write scope + owner surface | `owner.runtime.operations.execute` | active | migrated |
| `backend/index.js` | `/documents` | GET | legacy document read + role-derived LMS read | `org.documents.read` | active | migrated |
| `backend/index.js` | `/documents` | POST | legacy document create + role-derived members write | `org.documents.create` | active | migrated |

Legacy values remain documented in the #74 migration map for token/consumer transition tracking, but they are no longer accepted by backend functional guards.

## #92 delegation limits

Delegation rules are persisted separately from scopes and memberships. The baseline table (`role_delegation_rules`) is Owner-controlled and deny-by-default. Tenant restrictions (`org_delegation_restrictions`) can only disable an existing baseline path for assign and/or revoke; they never grant new delegation.

The evaluator contract for #89 is:

```js
const scopeDecision = requirePermission("org.members.roles.assign");
const delegationDecision = await evaluateRoleDelegation({
  organizationId,
  actorRoleIds,
  targetRoleId,
  operation: "assign",
});
```

#89 must still combine scope presence, same-organization, membership-required, target-role-delegable, and cannot-escalate-privileges. #75 + #92 only produce a preliminary signal; they do not implement final role-assignment authorization.

## Blocked administrative APIs

No delegation management endpoints were exposed in this issue because the #74 catalog does not currently declare active administrative permissions for delegation baseline or tenant restrictions. Candidate surfaces should be added in a future catalog issue before any route is exposed.

## #101 dependency

Delegation mutations require a policy invalidation port with `incrementPolicyVersion()` and `enqueueInvalidation()`. The service refuses mutation when the port is absent so production does not silently skip invalidation/outbox work.

## Operational constraints

No Logto tenant was modified, no Logto Management API call is made by the evaluator or request-time guards, no organization template is changed, no impersonation is inferred from delegation, and no local roles/permissions/memberships authority is created.
