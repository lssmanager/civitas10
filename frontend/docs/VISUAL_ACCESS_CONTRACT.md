# Visual Access Contract (#96)

## Inventory and migration decision

| Current element | Current responsibility | Problem | Action |
| --- | --- | --- | --- |
| `frontend/src/authz/rbacMatrix.ts` | screens/actions/roles/scopes/routes | mixes visual contract with role and scope evaluation | legacy compatibility only until #80 removes consumers |
| `frontend/src/navigation/routes.ts` | stable paths plus navigation metadata | duplicates labels and menu hierarchy | retained as route catalog input; `route-catalog.ts` wraps stable route references |
| `frontend/src/layouts/AppShell.tsx` | shell, responsive sidebar, topbar, static owner menu | renderer coupled to navigation definitions | preserved responsive shell and `NavCollapse`, extracted menu source to resolved navigation prop |
| `frontend/src/shared/ui/NavCollapse.tsx` | accessible recursive nav renderer | compatible with resolved view models | reused through `nav-item-adapter.ts` |
| `frontend/src/authz/ownerScopes.ts` | owner shell legacy scopes | legacy scope catalog | unchanged adapter boundary for #80; no new visual definitions use colon scopes |

## Maps

- Routes: `/owner`, `/owner/organizations`, `/owner/create`, `/owner/organizations/:organizationId`, `/owner/system/worker-queues`, `/account`, and prepared tenant route `/o/:organizationId/lms/grades` are represented in `route-catalog.ts`.
- Screens/components: owner overview, organizations directory/create/state, owner worker queues, account profile, and LMS grades are modeled as screen definitions.
- Actions: owner organization create, owner runtime refresh, account profile load, LMS grades edit/export are action definitions.
- Navigation: built recursively from screen navigation metadata and rendered by existing `AppShell` + `NavCollapse`.
- Guards: legacy `OwnerRouteGuard` still verifies backend/token owner access; `ScreenGate` adds screen-contract decisions without deriving route access from sidebar.
- Breadcrumbs: `build-breadcrumbs.ts` resolves from registry route metadata, not rendered sidebar.
- Role/scope checks: remaining role and colon-scope checks are isolated to legacy owner auth files and documented as #80 blockers.
- Duplications: labels still exist in `routes.ts` for compatibility; new registry uses translation keys.
- Gaps: #74/#91/#94/#95/#101 are represented as interfaces/catalog allowlists and fixtures, not as invented backend data.

## Public contracts

- `ScreenDefinition` and `ActionDefinition` are pure serializable metadata.
- `VisualAuthorizationContext` is normalized and does not expose JWTs, assignments, or roles.
- `evaluateScreenEligibility`, `evaluateActionEligibility`, and `resolveScreenVisibility` are pure and viewport-independent.
- `OrganizationVisualPreference` can only subtract visibility/order and is ignored across organizations.

## Adding a screen/action

1. Add action metadata in the owning feature folder with `defineActions`.
2. Add screen metadata in the same feature folder with `defineScreen` and route reference from `route-catalog.ts`.
3. Export from `authorization/registry/index.ts` only as an aggregate import.
4. Run `node scripts/authorization/validate-visual-contract.js`, frontend tests, typecheck, and build.

## Screen separation rule

Same resource with different role, data scope, read/write state, or buttons remains one screen. Separate screens require different resource, workflow, information architecture, owner-vs-tenant surface, or documented security/legal interaction.

## Blockers and rollout risks

- #80 must replace legacy owner-scope and global-role evaluation with a durable frontend authorization context.
- #91 must provide feature decisions for registered feature keys.
- #94/#95 must provide effective permissions/actions and data-scope availability; frontend never downloads assignments.
- #82 should complete full router/sidebar/breadcrumb migration for every existing page.

## #99 Authorization Governance Studio integration

- Owner route `/owner/organizations/:organizationId/governance` and tenant route `/o/:organizationId/settings/governance` consume the same governance read-model contract while keeping owner and tenant surfaces separate.
- The Governance Studio is an aggregate read/preview surface. Writes remain owned by #94, #95, #97, #98, #76 and #77; Logto Management API credentials never move to the browser.
- Permission matrix rows keep separate `canonical`, `rolePotential`, `ownerAllowed`, `tenantEnabled`, `effective` and `reason` fields; wildcards are not persisted.
- Data-scope modules reference taxonomy and unit IDs only. Resource-level filtering is still resolved by backend contracts.
- Access preview rows are read-only explanations and cannot mint a token or mutate grants.

## #99 refinements: reason provenance, asymmetric tabs, read-only preview

- Permission matrix reasons use `PermissionMatrixReason` with a `code` plus source versions for catalog, ceiling, activation and policy. `not_canonical` renders role/owner columns as not-applicable, while `ceiling_not_authorized` keeps canonical/role potential true and blocks only owner allowance.
- Governance tabs are explicit and asymmetric: owner uses overview, permissions/ceilings, taxonomy, units, data scope, aliases/navigation, access preview and audit; tenant uses active permissions, members/role assignments, data assignments, taxonomy, units, aliases/navigation and access preview.
- Access preview is a mounted read-only simulation with a persistent warning badge, actor/action inputs, a simulate button and separate decision/explanation panels. Preview API calls send `previewOnly: true` and never update the governance read model or grant state.

## #80/#82 refinement: effective authorization context and legacy removal

- Tenant authorization now loads `GET /o/:organizationId/me/authorization-context` through `useAuthorizationContextClient`, normalizes `effectivePermissions`, `effectiveActions`, data-scope capability summary and feature keys, and fails closed on loading, unauthenticated and error states.
- The tenant Governance route is wrapped by `TenantAuthorizationProvider` and `ScreenGate`, so direct URLs remain registered while access is evaluated from the normalized effective context rather than the sidebar.
- The remaining `rbacMatrix.ts` consumer (`pages/App/Dashboard.tsx`) was migrated away from `RBACMatrix` / `evaluateCapabilityRule`; `frontend/src/authz/rbacMatrix.ts` is removed and CI fails if it is reintroduced.
- `ownerScopes.ts` remains a temporary owner-token/login-scope compatibility boundary for the existing global owner shell until the owner equivalent of the backend authorization-context contract replaces it.
