# Issue #162 authorization closure evidence

## Objective
Canonical authorization closure for issue #162 as part of PR #205, evaluated against the Civitas contract that Logto materializes scopes while Civitas remains the effective authorization authority.

## Implemented files
- backend/authorization/policies/authorize.js: derives mandatory canonical policy plan server-side, validates active catalog permission, token materialization, canonical role potential, module availability, PBAC/ABAC policies and provenance before allow.
- backend/authorization/data-scope/dataScopeRegistry.js: removes permissive fallback to organization strategy; unknown role/capability strategy now resolves missing and must deny through server-side providers.
- backend/test/authz-canonical-core-contract.test.js: negative regressions for policies=[] bypass, role potential denial, missing PBAC providers, stale snapshot, missing ABAC/Data Scope, restrictive caller policies and planned permissions.
- backend/test/authz-policy-contract.test.js and backend/test/authz-tenant-entitlement-contract.test.js: corrected legacy permissive expectations to canonical roles and mandatory PBAC/ABAC context.
- .github/workflows/authorization-contract.yml and package.json: blocking authorization contract workflow and script aliases for catalog, role potential, PBAC, ABAC/Data Scope, migration, Logto offline planning, security gate and runtime consistency.

## Runtime integration
The runtime authorize() path no longer trusts consumer-supplied policies as the complete control set. It unions caller restrictions with a canonical plan per surface, validates canonical role potential before PBAC/ABAC, and fails closed when providers, snapshot, ceilings, activations or ABAC/Data Scope are unavailable.

## Positive tests
- npm test passed locally.
- npm run authz:policy-contract-check passed locally.
- npm run authz:data-scope-contract-check passed locally.
- npm run authz:logto-plan-check passed locally without real Logto credentials.

## Negative tests
- policies=[] plus arbitrary role denies with organization_role_unknown.
- valid scope plus role without permission potential denies with role_permission_missing.
- missing entitlement provider denies with policy_provider_missing.
- stale authorization snapshot denies with authorization_snapshot_stale.
- missing Data Scope provider denies with policy_provider_missing.
- cross-organization resource with additional policy denies with resource_organization_mismatch.
- planned permission with token scope denies with permission_inactive.

## Commands actually executed
- npm run authz:canonical-core-contract-check: pass.
- npm run authz:policy-contract-check: pass.
- npm run authz:data-scope-contract-check: pass.
- npm run authz:role-potential-check: pass.
- npm run authz:catalog-check: pass.
- npm run authz:logto-plan-check: pass.
- npm test: pass.
- npm run authz:data-scope-migration-check: pass (static; TEST_DATABASE_URL not set).
- npm run authz:runtime-consistency-check: pass.
- git diff --check: pass.

## Limitations pending
The GitHub required-check configuration itself is repository settings outside this patch. Data Scope migration check used static mode because TEST_DATABASE_URL was not configured in this local environment.

## SHA / HEAD
Inspected and implemented from HEAD 51eff244a5ef0c0bf70817033a089d821bad6026 on branch work.

## Relationship with other issues
Issues #161-#166 are interdependent: catalog (#161), role potential (#162), ABAC/Data Scope (#163), PBAC engine (#164), Logto planner materialization (#165), and CI/security contract enforcement (#166) are validated together rather than as isolated documentary artifacts.

## Closure criterion
This issue is considered complete only with implementation, negative tests, runtime integration and CI workflow evidence in this branch; no issue is automatically closed by this report.
