# Issue 167 authorization reconciliation report

## Objective
Read-only reconciliation of legacy domains, consumers, role assignments, and Logto before migration.

## Baseline
HEAD a9a9d572c2a28cbf5b9cd292e30ba36bdd691290; PR #144 a51769d914b7cc831908d45115b46101fcc2bbe9; PR #170 997a245545a15065e80f336f6853acb864dbca93.

## Scope
Read-only; no bootstrap, apply, migration, provisioning, external writes, or contract changes.

## Methodology
Inspected GitHub issue/PR pages where gh was unavailable, local contracts, generated artifacts, runtime manifests, role model, Logto plan, and deterministic rg scans.

## Hashes
Authored 38648f3040aff7d5200f1ea29089c92bc0fb046b97e5bf5ff7df6354d429b4cc; generated 70e028318384e5c7a4c683ebd789014cc775fa391648d75a5cd67ffb5b19ede4; runtime aaa147d3630d0009ad605e8eeffc561365b995f820c8f0ed9155d943829dc61d; role model 6fa7ae75c51db22cfebee1b62aea13cd5bf40f9bfe15ebaad3d1bb13affd06ef; Logto plan 7521cd48cf80064634a1b0ee51094ab2bb65f1c8834559a5aa7c9d25d3fc35a7; catalog 57adc4a7b28cb5ddb79bb7f66257d5d226cf27e174f22a7b0a19628aebf4e76d.

## Legacy summary
{"total":177,"active":0,"planned":31,"deprecated":0,"absent":0,"verification_required":146,"blocked":138}

## Target summary
Namespaces 14; permissions 160; roles 13; domains/capabilities/surfaces derived from catalog.

## Contradictions and decisions
All ambiguous legacy IDs remain blocked until explicit per-ID decisions and Logto verification.

## Blockers
See blockers.json.

## Logto state
Local plan exists; remote state is verification_required.

## Verdict
BLOCKED_BY_MISSING_EVIDENCE

## Acceptance criteria
1. PASS — reconciliation produced audit artifacts only.
2. PASS — active target IDs have catalog consumers or verification-required Logto state.
3. PASS — every observed legacy ID has an explicit decision in legacy-inventory.json.
4. PASS — categories separate business modules, platform capabilities, adapter administration, and surfaces.
5. PASS — no migration or silent rename was executed.
6. PASS — JSON outputs are deterministic except provenance timestamp.
7. PASS — catalogHash included.
8. NOT_VERIFIABLE — sourceVersion is not present in the catalog and is marked verification_required.
9. PASS — HEAD, merge-base, PR #144 and PR #170 refs included.
10. PASS — authored hash included.
11. PASS — generated hash included.
12. PASS — runtime manifest hash included.
13. PASS — Logto plan hash included.
14. PASS — legacy decisions are individual rows.
15. PASS — Logto non-observed remote state is verification_required in inventories.
16. PASS — bootstrap was not executed by this audit.
17. PASS — apply was not executed by this audit.
18. PASS — blockers include concrete sub-issue proposal.
19. PASS — reversible migration plan exists.
20. PASS — no removal is authorized.

## Files created
- artifacts/authorization/issue-167/reconciliation-report.md
- artifacts/authorization/issue-167/legacy-inventory.json
- artifacts/authorization/issue-167/canonical-target-inventory.json
- artifacts/authorization/issue-167/reconciliation-matrix.json
- artifacts/authorization/issue-167/blockers.json
- artifacts/authorization/issue-167/migration-plan.md
- artifacts/authorization/issue-167/provenance.json
