# Issue #162 Closure Evidence — RBAC canonical role bundles and active-only scopes

## Baseline

- Initial HEAD before Issue #162 work: `2c19a36e7ea2b24ef1d6300dc0915e2603a1b14c`.
- Local branch: `work`.
- Issue #161 catalog hardening is present and used as the role-model source of permission metadata.
- No Logto writes, role provisioning, or remote mutation were performed.

## Role model contract

- Role model version: `2026-07-civitas-phase3-role-bundles-v1`.
- Catalog hash: `57adc4a7b28cb5ddb79bb7f66257d5d226cf27e174f22a7b0a19628aebf4e76d`.
- Role model hash: `4edf94cc7fef6d97033ba2c4141eb1350cce96900a2ea764f230ab9382c73974`.
- Canonical organization roles: `13`.
- Canonical bundles: `49`.
- Target potential counts: `81`, `57`, `53`, `68`, `36`, `45`, `17`, `17`, `28`, `17`, `12`, `11`, `15`.
- Active executable scopes are generated separately from target potential and include only active organization-surface catalog permissions.
- Bundle keys are composition metadata only and are never emitted as scopes.

## Artifact hashes

| Artifact | SHA-256 |
| --- | --- |
| `contracts/authorization/civitas-role-bundles.json` | `4a6d1f7babc62308e90a1af5d2531de9ce1ac3ed43ab29acbbfcd9662db05b8c` |
| `core/authz/roles/generated/role-model.js` | `cefcd4c6d1ef1424ab1aaf267c0574ae7268ff45c8bd7585c97cff2f94ed1c72` |
| `artifacts/authorization/role-potential.json` | `64d52be429f09f793ec736b900863bd2b06347a5a7a5c6b8c65301058d190acd` |
| `artifacts/authorization/active-role-scopes.json` | `358b8f972ea3209662fae11b5ba5c9d72b05762bd80acc0a365b8f91d44f2062` |

## Validation results

- `npm run authz:role-model:generate`: passed twice with deterministic bytes.
- `npm run authz:role-model:check`: passed, including target counts, active-only scopes, bundle-not-scope checks, artifact metadata, and fail-closed drift checks.
- `npm run authz:permission-catalog:check`: passed.
- `npm test`: passed.
- `git diff --check`: passed.

## Remaining follow-up scope

- Role potential remains a target/planning view and does not bypass Owner ceiling, Tenant activation, PBAC, ABAC, module availability, or snapshot freshness.
- Logto apply remains out of scope here; generated active-role scopes are exact local contract inputs only.
- Issues #163–#167 remain open for ABAC/PBAC/Logto sync/security/reconciliation follow-up work.
