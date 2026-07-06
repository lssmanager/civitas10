# Civitas authorization separation: global product vs organization-scoped

## Diagnosis

Civitas previously had the primitives for a clean Logto split, but the code path was still ambiguous:

- Frontend `useApi().fetchWithToken(endpoint, options, organizationId?)` selected either a global access token or an organization token from one helper. Owner callers used `ownerApiFetch`, but the generic helper remained available for accidental `/owner/*` calls with organization tokens.
- Backend owner routes used the generic global `requireAuth(API_RESOURCE)` and then `requireGlobalOwner`. That verified audience and `owner_global`, but it did not explicitly reject organization tokens or declare the global scopes each owner route needs.
- The legacy POST alias `/organizations` was protected like an owner operation. It remains accepted for compatibility, but it is global owner provisioning and must use the same global token contract as `/owner/organizations`.
- Organization routes (`/documents`) correctly used organization tokens through `requireOrganizationAccess`, and that support must be preserved for the SaaS RBAC matrix.

## Logto basis

Logto distinguishes authorization scenarios by token type and context:

- Global API resources protect APIs shared across the product with global roles and permissions. Their access tokens target the global API resource audience and have no organization context.
- Organization-level API resources use organization tokens and organization permissions inside a specific organization context.
- Organization permissions and organization templates model reusable tenant roles such as organization admin and organization member.
- APIs must validate issuer, audience, expiry and scopes, then enforce the appropriate global or organization permissions.
- Custom token claims may expose role names, but Civitas treats Logto as canonical for identity, organizations, memberships, roles, permissions and tokens.

References: https://docs.logto.io/authorization, https://docs.logto.io/authorization/global-api-resources, https://docs.logto.io/authorization/organization-level-api-resources, https://docs.logto.io/authorization/organization-permissions, https://docs.logto.io/authorization/role-based-access-control, https://docs.logto.io/authorization/organization-template, https://docs.logto.io/authorization/validate-access-tokens, https://docs.logto.io/developers/custom-token-claims, https://docs.logto.io/end-user-flows/organization-experience/setup-app-service-with-management-api.

## Canonical sources

- Logto is canonical for identity, organizations, memberships, global roles, organization roles, permissions and tokens.
- Civitas PostgreSQL stores operational state, audit, reconciliation, worker coordination and local runtime records only.
- External capabilities are connector/adapters and are never the canonical authority for Logto entities.

## Global product authorization

Global owner routes use a Logto global API access token for `CivitasAuthContract.logto.apiResource`. They must not use organization tokens.

Minimum declared global role and permissions:

- Role: `owner_global`
- Permissions: `owner:read`, `owner:write`, `runtime:read`, `runtime:write`, `worker-queues:read`, `worker-queues:write`, `organization:create`, `organization:read`, `organization:write`, `impersonation:write`

Current route mapping:

| Route | Token | Required global scopes | Required global role |
| --- | --- | --- | --- |
| `GET /api/owner/me` | Global API access token | `owner:read` | `owner_global` |
| `GET /api/owner/organization-template` | Global API access token | `organization:read` | `owner_global` |
| `GET /api/owner/organizations` | Global API access token | `organization:read` | `owner_global` |
| `POST /api/owner/organizations` | Global API access token | `organization:create` | `owner_global` |
| `POST /api/organizations` | Global API access token | `organization:create` | `owner_global` |
| `GET /api/owner/organizations/:organizationId/operational-state` | Global API access token | `owner:read`, `runtime:read` | `owner_global` |
| `GET /api/owner/system/worker-queues` | Global API access token | `worker-queues:read` | `owner_global` |
| `GET /api/owner/system/registry` | Global API access token | `runtime:read` | `owner_global` |
| `POST /api/owner/system/operations` | Global API access token | `runtime:write` | `owner_global` |

Rules:

- `owner_global` never requires `organization_id`.
- `owner_global` never requires membership in any organization.
- Owner routes never authorize with organization roles.
- Owner routes reject organization tokens before executing business logic.

## Organization-scoped authorization

Organization screens and APIs continue to use organization tokens and organization context.

Minimum declared organization model:

- Roles: `organization admin`, `organization member`
- Permissions: existing tenant-scoped permissions such as `read:documents` and `create:documents`, plus future organization-level API permissions from the Logto organization template.
- Token source: `getOrganizationToken(organizationId)` in frontend, `requireOrganizationAccess(...)` in backend.

Rules:

- Organization endpoints must validate the organization token and match `req.params.organizationId` when a route contains an organization id.
- Organization roles/permissions must not authorize global owner routes.
- Civitas DB may store operational anchors such as `logto_organization_id`, but it must not duplicate Logto canonical memberships, roles or permissions.

## Frontend split

- `ownerApiFetch` obtains `getAccessToken(API_RESOURCE)`, validates that the token is a user token, and is the only owner API client used by `frontend/src/api/owner.ts`.
- `organizationApiFetch` obtains `getOrganizationToken(organizationId)` and is the only tenant API client used by `frontend/src/api/organization.ts`.
- `globalApiFetch` exists for non-owner global API calls; it does not accept an organization id.
- No helper accepts an optional `organizationId` that silently changes token type.

## Backend split

- `requireGlobalAccess({ resource, requiredScopes })` validates the global API resource token, rejects tokens that contain organization context, checks global scopes and then lets route-level middleware enforce `owner_global`.
- `requireOrganizationAccess({ requiredScopes, requiredRoleName })` remains the organization-token middleware for tenant routes.
- `/api/owner/*` routes use `requireGlobalAccess` and `requireGlobalOwner`; organization endpoints continue using `requireOrganizationAccess`.

## Impersonation base

Impersonation is reserved as a global owner capability, represented by `impersonation:write`. It is not granted implicitly by organization membership or organization admin status. When implemented, each impersonation session must be auditable with at least actor Logto user id, target Logto user id, target organization id when applicable, reason, start/end timestamps, and source global token claims.

## Validation checklist

- Search owner routes with `rg -n '"/owner|/api/owner|ownerApiFetch|organizationApiFetch|requireGlobalAccess|requireOrganizationAccess' backend frontend docs`.
- Confirm every `/owner/*` backend route uses `requireGlobalAccess` plus `requireGlobalOwner`.
- Confirm frontend owner flows call only `ownerApiFetch` and tenant flows call `organizationApiFetch` / `getOrganizationToken`.
- Confirm organization auth remains present in `requireOrganizationAccess` and tenant document routes.
