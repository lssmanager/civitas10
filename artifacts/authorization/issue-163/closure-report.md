# Issue #163 Closure Evidence — ABAC Data Scope strategy registry and resource-boundary enforcement

## Baseline

- Initial HEAD before Issue #163 work: `96af006`.
- Local branch: `work`.
- Consumes Issue #161 permission catalog hardening and Issue #162 generated role model.
- No Logto writes, bootstrap apply, remote role mutation or permission provisioning was performed.

## ABAC/Data Scope contract

- Strategy registry version: `2026-07-civitas-data-scope-strategies-v1`.
- Registered strategies: `global_owner`, `organization`, `organization_and_units`, `self`, `self_or_organization`, `academic_relationship`, `teaching_assignments`, `planning_relationship`, `planning_editable`, `planning_owned`, `assigned_reviews`, `assigned_approvals`, `approved_plans`, `community_membership`, `community_moderation`, `hr_relationship`, `payroll_relationship`, `scheduling_relationship`, `support_relationship`, `communication_relationship`.
- Catalog hash after strategy normalization: `57adc4a7b28cb5ddb79bb7f66257d5d226cf27e174f22a7b0a19628aebf4e76d`.
- Role model hash after catalog hash propagation: `4edf94cc7fef6d97033ba2c4141eb1350cce96900a2ea764f230ab9382c73974`.
- Missing scope remains deny-by-default and never widens to organization-wide access.
- Planning strategies are registered and testable but Planning permissions remain planned/non-executable.
- `notifications.preferences.read`, `account.profile.read`, `governance.*`, and legacy baseline IDs remain non-executable unless a canonical permission, surface, owner and strategy are explicitly approved in the catalog.

## Durable assignment and enforcement evidence

- `AuthorizationScopeAssignment` persistence guardrails are represented in migration `0016_authorization_scope_assignments_contract.sql` with exactly-one-target and active uniqueness constraints.
- Assignment service validates exactly one target, membership binding, taxonomy status, unit tenant/status and resource tenant/status before persistence.
- Evaluator emits query constraints/resource assertions per complete role path and rejects privilege-fragment composition.
- LMS adapter filters lists/counts/exports before pagination, denies direct-ID enumeration and marks bulk operations as all-or-nothing resource assertions.
- Scope diagnostics are redacted while audit/outbox provenance is preserved.

## Validation results

- `npm run authz:data-scope-contract-check`: passed.
- `npm run authz:permission-catalog:check`: passed.
- `npm run authz:role-model:check`: passed.
- `npm test`: passed.
- `git diff --check`: passed.

## Remaining follow-up scope

- Issue #164 remains the PBAC decision engine integration layer.
- Issue #165 remains Logto sync/dry-run/apply planning.
- Issues #166 and #167 remain security regression and migration reconciliation follow-up.
