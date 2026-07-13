# Phase 2 tenant isolation and entitlement overlay

## Tenant route inventory

| routeId | method | current path | canonical path | surface | middleware | permission | policies | legacy behavior | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `documents.read` | GET | `/documents` | `/o/:organizationId/documents` | organization | `requireOrganizationAccess` → `requireOrg` → `requirePermission` → `requireAuthorization` | `org.documents.read` | `same-organization`, `membership-required` | authenticated 308 redirect | canonical mounted |
| `documents.create` | POST | `/documents` | `/o/:organizationId/documents` | organization | `requireOrganizationAccess` → `requireOrg` → `requirePermission` → `requireAuthorization` | `org.documents.create` | `same-organization`, `membership-required`, `critical-operation-audited` | 410 rejection | canonical mounted |
| `owner.organizations.operational_state` | GET | `/owner/organizations/:organizationId/operational-state` | unchanged | owner | `requireGlobalAccess` → `requireGlobalOwner` | `owner.runtime.read` | owner surface contracts | none | valid owner route |

The canonical tenant surface is `/o/:organizationId/*`. The route `organizationId` is compared only with the verified token `organization_id`; body, query, and custom header organization identifiers are not authorities.

## Route builders

Backend and frontend route builders create canonical tenant paths with slash-injection protection. Consumers should use `organizationPath(organizationId, relativePath)` instead of concatenating `/o/` strings.

## Legacy behavior

Safe legacy GET/HEAD routes may redirect after the organization token has been verified. Legacy mutations are rejected rather than redirected because automatic redirects can replay writes. Legacy controllers must not remain as a second functional tenant surface.

## Entitlement overlay

The entitlement overlay restricts authorization after scope-only JWT validation and contextual policy evaluation. It never creates scopes. A role path is effective only when all of the following are true for the same path:

1. the verified token contains the permission scope;
2. the Logto role ID maps to a role whose canonical potential includes the permission;
3. an Owner ceiling row exists and is `allowed=true`;
4. a tenant activation row exists and is `enabled=true`;
5. the authorization policy snapshot is current.

Role-path fragments are never combined across roles.

## Schema and invariants

`org_role_entitlement_limits` stores Owner ceilings by organization, Logto role ID, and permission key. `org_role_permission_activations` stores tenant activations and references the matching ceiling. The migration adds a composite FK and a constraint trigger so `enabled=true` cannot coexist effectively with `allowed=false`.

`locked=true` means tenant admins cannot edit that activation; it does not mean the permission is visible or allowed without the other layers.

## Runtime consistency dependency

Mutation services require a #101-compatible runtime consistency port for monotonic policy versions, outbox enqueueing, and audit writes. There is no silent production no-op. Tests use fakes.

## Blocked endpoints

The candidate endpoint scopes `owner.entitlement_limits.read`, `owner.entitlement_limits.manage`, `org.role_permission_activations.read`, and `org.role_permission_activations.manage` are not exposed unless they are active in the canonical catalog. Until then, repository, service, evaluator, and policy-provider contracts are available for integration without public endpoints.

## Authorization context

`buildAuthorizationContext()` returns separate `tokenPermissions` and `effectivePermissions`. The frontend may use this as display context only; backend authorization remains authoritative.
