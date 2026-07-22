# Issue #161 Closure Evidence — Canonical permission catalog v2

## Baseline

- Initial HEAD before Issue #161 hardening: `804472cb306eb6ab6e6022deb70f59dfb613e307`.
- Final implementation HEAD before this evidence commit: `b06d6c8439e02828c523b40d0f5b78a852c65506`.
- Local branch: `work`.
- PR #144 foundation commit verified as ancestor of HEAD: `a51769d914b7cc831908d45115b46101fcc2bbe9`.
- PR #170 catalog implementation commit verified as ancestor of HEAD: `997a245545a15065e80f336f6853acb864dbca93`.
- No PR #170 cherry-pick, duplicate merge, Logto apply, or direct `main` merge was performed.

## Contract

- Contract version: `2026-07-civitas-permission-catalog-v1`.
- Role model version: `2026-07-civitas-phase3-13-role-v1`.
- Catalog hash: `a3cbbad3cf4bb959eeb3a62404fb37b03aa1d0fb45e8a51c6fc0978d11eb1793`.
- Namespaces: `owner`, `org`, `lms`, `planning`, `crm`, `marketing`, `community`, `payments`, `hr`, `scheduling`, `support`, `analytics`, `reports`, `platform`.
- Organization roles: `organization_admin`, `organization_director`, `organization_headdirector`, `organization_headteacher`, `organization_groupleader`, `organization_teacher`, `organization_student`, `organization_parent`, `organization_secretary`, `organization_accountant`, `organization_billing`, `organization_payroll`, `organization_member`.
- Target permissions: `160`.
- Explicit legacy decisions: `10`.
- Observed legacy baseline IDs classified separately: `13`.
- Active executable permissions: `5`.
- `verification_required` permissions remain non-executable.
- Planning remains entirely `planned` and is absent from the active-only selector.

## Artifact hashes

| Artifact | SHA-256 |
| --- | --- |
| `contracts/authorization/civitas-permission-catalog.yaml` | `19322f4cd8d72e10d167568374d6658fa3b99cc66ae525fa90dd340cf01f308c` |
| `contracts/authorization/schemas/permission-catalog.schema.json` | `d6b8ab88f093ff370e4879a157338dfa83eda71f9f581d266c74a5e99dceed7d` |
| `core/authz/catalog/generated/permission-catalog.js` | `c0a9bd767092dff587f35ee8cc85ae3aeb5fa3191781899a9d645e37f895e81f` |
| `artifacts/authorization/permission-catalog.json` | `99b57ec7993c22a406963b05fbcab29c40b0e1f2b28cc621b8c82de4b51152e1` |
| `artifacts/authorization/active-permissions.json` | `cc774d7583378ad35556d233b6891317b6a9a1c2966488bf5d0efb09b0c08899` |
| `artifacts/authorization/ci-inventory.json` | `dc982b40e26133f7ec1972b6c9bcb6357bd67ba49989e5cfe262137a4d2a7268` |

## Validation results

- `npm run authz:permission-catalog:schema-check`: passed.
- `npm run authz:permission-catalog:validate`: passed.
- `npm run authz:permission-catalog:generate`: passed twice with no subsequent drift.
- `npm run authz:permission-catalog:check`: passed, including schema, semantic validation, fail-closed drift checks, deterministic generation regression coverage and artifact hash tests.
- `npm run authz:naming:check`: passed.
- `npm run logto:authz:contract-check`: passed in local contract-check mode; no Logto writes were performed.
- `npm test`: passed.
- `git diff --check`: passed.
- Required artifact existence checks: passed.
- `git check-ignore -v artifacts/authorization/permission-catalog.json || true`: produced no ignore rule, confirming the inventory artifact is tracked.

## Remaining blockers and follow-up scope

- Issues #162, #163, #164, #165, #166 and #167 remain open and are not closed by this PR.
- Planning activation remains blocked until its downstream contracts, application slices, API, UI, observability and rollback work are complete.
- Logto mutation/apply work remains out of scope for #161 and belongs to follow-up Logto synchronization work.
