# Phase 2 authorization contract (#74)

This document records the repository evidence used to build the canonical authorization catalog and the deterministic export consumed by the future Logto bootstrap (#87). This issue does **not** provision Logto, call the Management API, or add a seed script.

## Verified current state before implementation

- The existing canonical API resource is `https://civitas.didaxus.com/api` in `core/shared/civitas-shared.contract.cjs`.
- Legacy global scopes are still present in the shared contract: `owner:read`, `owner:write`, `runtime:read`, `runtime:write`, `worker-queues:read`, `worker-queues:write`, `organization:create`, `organization:read`, `organization:write`, and `impersonation:write`.
- Legacy organization document scopes are still present as `read:documents` and `create:documents`.
- `backend/authorization/roles.js` now contains only canonical role-name constants; backend functional authorization is scope-only after #75.
- Current production consumers of legacy permissions remain in `backend/index.js`, `backend/middleware/requirePermission.js`, `backend/middleware/auth.js`, `frontend/src/authz/rbacMatrix.ts`, and `frontend/src/authz/ownerScopes.ts`.
- Connector/capability contracts exist in `backend/contracts/foundation.js`, `backend/connectors/adapters/contracts/index.js`, and operational connector services; adapter names are not used as canonical permission names.
- No repository-owned `scripts/logto` directory or `seed-logto-roles` script exists. Existing Logto files are identity adapters/configuration, not provisioning for #87.

## Canonical artifacts

- `core/authz/catalog/*` contains modular permission modules by product domain.
- `core/authz/catalog/registry.js` aggregates permissions in deterministic name order.
- `core/authz/roles/*` contains the separated global and organization role-permission matrices.
- `core/authz/index.js` exports `getAuthorizationManifest()` for #87 with `{ contractVersion, resource, permissions, globalRoles, organizationRoles, rolePermissionAssignments }`.
- `core/authz/legacy/legacy-permission-map.js` maps currently observed legacy scopes to canonical replacements without changing production authorization behavior.
- `core/authz/validation/validate-authz-contract.js` is the reusable CI/#87 validator.

## Status classification summary

- Active permissions are limited to permissions with concrete repository consumers: owner shell/runtime/organization operations and the two tenant document routes.
- Planned permissions include profile-like self-service areas, communications, scheduling availability management, tenant impersonation, billing seat workflow, owner audit/analytics, and connector/support/CRM/marketing/community/notifications domains without implemented consumers.
- Deprecated permissions are not emitted in the canonical catalog because `organization.*` is forbidden for new work; deprecation behavior is tested with validator fixtures and legacy migration entries.

## Pending product decisions and risks

- `profile.read/write` remains excluded from the active catalog until profile endpoints require API permissions instead of OIDC/authenticated context.
- `communications.messages.*`, `scheduling.availability.manage`, `org.impersonation.execute`, and all seat-change workflow permissions remain planned.
- The legacy runtime still authorizes through shared contract scopes and local role matrices; replacing those checks belongs to #75/#80/#90, not #74.
- The role matrix intentionally grants only active permissions and does not encode data scopes, subjects, sections, groups, campuses, aliases, ceilings, or entitlement overlays.
