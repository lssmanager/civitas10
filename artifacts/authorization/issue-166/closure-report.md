# Issue #166 Authorization security gate closure evidence

## Scope

Issue #166 adds a deterministic CI gate that composes existing authorization validators and enforces Phase 3 security invariants without using evidence from another branch.

## Gate coverage

- Required authored/generated artifacts must exist and match deterministic inventory output.
- Catalog cardinality is enforced: 14 namespaces, 13 organization roles including `organization_groupleader`, 160 permissions and 10 legacy decisions.
- Executable frontend/operation registry permission references must exist as active permissions in the same canonical runtime catalog.
- Active permissions must retain consumer, policy, runtime path and test evidence.
- Logto plan/drift artifacts must carry `catalogHash`, `roleModelVersion`, `contractVersion`, target identifier and drift buckets.
- Legacy and provider-shaped IDs are constrained by the existing versioned naming allowlist and explicit legacy decisions.
- Billing/payments migration is treated as an explicit decision only; no automatic mapping is inferred.
- The Logto identity discovery probe is covered for opt-in remote reads, safe methods, token endpoint POST-only exception, anti-SSRF host validation, query allowlist and streaming response-size limits.

## Negative fixtures

- `governance.preview.read` active outside the catalog fails closed.
- 12-role/omitted `organization_groupleader` drift is represented as a fixture class.
- Planned executable leakage, wrong surface, missing artifact, wildcard/colon legacy ID and wrong Logto resource indicator are covered by deterministic gate rules or fixture metadata.

## CI integration

`npm test` now includes `npm run authz:security-gate:check`, which runs the generated inventory drift check plus security gate and discovery-probe regression tests.

## Follow-up scope

#167 remains open for legacy reconciliation reporting. #166 provides the merge-blocking security gate and regression coverage.
