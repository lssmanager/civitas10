# Issue #164 PBAC authorization decision closure evidence

## Baseline

- Working branch: work.
- Baseline HEAD before #164 hardening: `2e2fece244b3fcb9957cefca221385d6b37a3b89`.
- Catalog hash: `57adc4a7b28cb5ddb79bb7f66257d5d226cf27e174f22a7b0a19628aebf4e76d`.
- Role model version: `2026-07-civitas-phase3-role-bundles-v1`.

## Corrective decisions

- Unknown permission IDs now deny with `permission_unknown`; planned/deprecated/absent runtime candidates deny with `permission_inactive`.
- Visual/operation registry catalog drift denies with `registry_catalog_mismatch`.
- Consumer surface drift denies with `consumer_surface_mismatch`.
- Owner runtime read uses `owner.runtime.read`; operation execution uses `owner.runtime.operations.execute`.
- `governance.preview.read` remains absent from the active catalog and is covered as a fail-closed visual/API mismatch.

## Provenance and registries

- Authorization decisions include `catalogHash`, `roleModelVersion` and `snapshotProvenance`.
- Governance operation inventory entries include catalog and role-model provenance.
- The compiled visual registry carries catalog hash, role model version and snapshot provenance.

## Validation recorded

- `npm run authz:permission-catalog:check`: passed.
- `npm run authz:role-model:check`: passed.
- `npm run authz:naming:check`: passed.
- `npm run logto:authz:contract-check`: passed; no Logto writes performed.
- `npm run authz:policy-contract-check`: passed.
- `node --test frontend/src/authorization/visualContract.contract.test.mjs`: passed.
- `npm test`: passed.
- `git diff --check`: passed.

## Follow-up scope

#162, #163, #165, #166 and #167 remain separate follow-up scopes. This closure evidence only covers #164 PBAC/catalog-bound authorization hardening.
