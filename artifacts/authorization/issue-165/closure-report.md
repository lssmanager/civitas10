# Issue #165 Logto authorization synchronization closure evidence

## Scope

Issue #165 hardens the Logto authorization sync workflow around the canonical Civitas authorization contract. Logto remains the identity/token issuer; Civitas remains the source of business authorization decisions.

## Implemented controls

- `plan-rbac` is the default read-only workflow.
- Plan mode emits a deterministic inventory with `catalogHash`, `roleModelVersion`, `contractVersion`, `targetIdentifier`, `remoteStateStatus`, drift buckets and provenance.
- Without Logto M2M credentials, remote state is marked `verification_required`; local files are never asserted as real Logto state.
- Apply mode requires explicit confirmation, successful local preflight, audit actor, audit reason, expected plan hash and idempotency key.
- Apply refuses stale contract hashes, stale remote fingerprints, mismatched expected plan hash and destructive operations.
- Drift reports distinguish `missing`, `extra`, `legacy`, `wrongSurface`, `plannedLeakage` and `wrongResourceIndicator`.
- The only accepted API resource indicator remains `https://civitas.didaxus.com/api`.
- OIDC login scopes (`openid`, `profile`, `email`, `offline_access`) remain separated from API authorization permissions.

## Evidence

- Deterministic read-only plan artifact: `artifacts/authorization/logto-plan.json`.
- Transport-spy test proves plan mode performs no POST/PATCH/PUT/DELETE writes.
- Apply tests prove unapproved, stale-hash and expected-plan-hash mismatch paths reject.
- No Logto writes were performed.

## Follow-up scope

#166 and #167 remain open for CI/red-team and legacy reconciliation reporting. #165 does not provision production Logto state.
