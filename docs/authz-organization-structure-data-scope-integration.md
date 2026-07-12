# Organization Structure / Data Scope Integration (#98 Part B)

This integration does not rebuild #98 Core or #95. It connects #98 ScopeCandidates to #95 `authorization_scope_assignments` as derived projections with source provenance. Derived grants are eventual and fail closed; revocations are immediate because runtime source validation excludes active projections when the source membership, role path, unit, taxonomy link, or translation is no longer valid.

`scopeCandidateIntegration` normalizes #98 candidates to a canonical target shape, validates exact-one-target semantics, checks active platform translation rules, preserves source ID/version and translation rule version, and maps candidates into derived assignment inputs. Projection identity is deterministic across organization, subject, role, capability, source, translation, and target so repeated reconciliation creates zero duplicate grants.

`scopeProjectionReconciler` materializes valid candidates through the #95 assignment service, updates stale projections, revokes projections whose source disappeared, and emits audit/outbox-compatible integration events. The reconciler is idempotent and tenant-scoped; retry jobs must pass through the safe job payload contract and never carry bearer tokens, secrets, audience member lists, or arbitrary force-activation data.

`sourceValidationProvider` is the immediate-deny path. Even if a derived assignment remains `active` in storage, the #95 evaluator can call source validation and deny if the unit membership is revoked, expired, cross-tenant, role-mismatched, or attached to an inactive unit. This is the security boundary that prevents stale projections from authorizing.

`accessImpactService` supplies a redacted #81/#99 read model showing unit, relationship, safe subject placeholder, role ID, ScopeCandidate IDs, projection status, translation rules, and versions without tokens, SQL, secrets, connector config, or full student lists.

`backfillPlanService` implements check/plan only. It reports candidates/projections to create, unresolved memberships, warnings, and a deterministic plan hash. It does not auto-apply grants on deployment and does not modify Logto, roles, scopes, or taxonomy values.

Audiences remain non-authoritative: audience membership/materialization can support preview, reporting, communications, and impact analysis, but never grants permission or data scope unless a future explicit platform-owned translation rule is approved.
