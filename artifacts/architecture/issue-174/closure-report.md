# Issue #174 Closure Report — ADR-003 Federated Eleven-Module Catalog

## 1. Executive decision

NOT_READY_TO_CLOSE

## 2. Closure status

closureStatus: NOT_READY_TO_CLOSE

This closure run cannot close #174. The required ADR file is absent from the inspected branch, no human architecture acceptance can be verified, `origin/main` is unavailable, and the current branch history contains unrelated #154/#167 artifacts that must be removed from the #174 PR scope.

## 3. Baseline

- repository: /workspace/civitas10
- branch: work
- inspectedHeadSha: 057c711833111b7842349ea6bc65ce98d444be5e
- originMainSha: null
- mergeBaseSha: null
- workingTreeStateAtStart: clean
- executionTimestamp: 2026-07-21T00:00:00Z
- foundation144MergeSha: a51769d914b7cc831908d45115b46101fcc2bbe9
- foundation144Verified: true

`git fetch origin --prune`, `git rev-parse origin/main`, and `git merge-base HEAD origin/main` failed because this checkout has no configured `origin` remote. Therefore review, merge-base, diff-scope, and preexisting-failure proof against `origin/main` remain `verification_required`.

## 4. Diff scope

`git diff --name-status origin/main...HEAD`, `git diff --stat origin/main...HEAD`, and `git diff --check origin/main...HEAD` could not run because `origin/main` is unavailable.

The latest inspected history contains #154 discovery artifacts and #167 reconciliation closure artifacts. Those files are not part of the #174 closure scope and were removed from this working tree as cleanup of prior PR contamination. The #174 scope must remain documentation-only: ADR-003 and, if needed, this closure report.

## 5. ADR status and acceptance evidence

- adrPath: `docs/adr/ADR-003-module-catalog-v2-federated-runtime.md`
- adrPresent: false
- adrStatus: null
- architectureApprovalEvidence: missing
- reviewDecision: unavailable (`gh` is not installed and no PR metadata is available locally)
- unresolvedBlockingThreads: verification_required

Closure blocker: `ADR_003_MISSING`.

Closure blocker: `HUMAN_ARCHITECTURE_ACCEPTANCE_REQUIRED`.

Codex did not mark the ADR as `Accepted` and did not create a substitute ADR during closure.

## 6. Eleven-module catalog

Required target catalog for #174 remains unverified in this branch because ADR-003 is absent:

```text
lms
planning
crm
marketing
community
payments
hr
scheduling
support
analytics
reports
```

- moduleCount: verification_required
- planningPresent: verification_required
- duplicateModuleIds: verification_required
- providerShapedModuleIds: verification_required
- platformCapabilityModuleIds: verification_required

## 7. Planning lifecycle and deployment mode

Required #174 decision remains unverified in this branch:

- planningLifecycle: verification_required
- planningDeploymentMode: verification_required
- productOwner: verification_required
- publicPlatformBoundary: verification_required

Planning must not be considered `active`, installed, mounted, visible, permitted, or executable by this closure report.

## 8. Platform capabilities excluded from module catalog

Required exclusions remain a closure review requirement because ADR-003 is absent. The future ADR must explicitly keep these out of the business module catalog:

```text
identity, authentication, authorization, oidc, saml, scim, logto,
entitlements, seats, billing-entitlements, audit, queues, events,
secrets, storage, email, communications, notifications, observability,
video, mcp
```

Expected classification:

- Identity Federation: platform capability/workstream.
- OIDC/SAML: identity federation protocols.
- SCIM: provisioning protocol and technical ingress.
- Logto: identity/authentication provider and materialization authority.
- Entitlements/Seats: shared access capability, not a module.
- MCP: governed delivery surface.
- Queues/Outbox/Operations: shared runtime capabilities.

## 9. PR #201 evidence classification

PR #201 is not available for local inspection in this checkout. It must be treated only as secondary architecture discovery evidence for #154 when reviewed externally.

```text
evidenceType: secondary_architecture_discovery
implementsIssue174: false
definesModuleCatalog: false
requiredForIssue174Merge: false
```

PR #201 must not be used as evidence that #174 is implemented, accepted, reviewed, mergeable, or complete.

## 10. Partial supersession

Because ADR-003 is absent, partial supersession is not verified. The future accepted ADR must partially supersede only:

1. ten-module cardinality in the PR #144 foundation;
2. closed ten-module lists in ADR-001 as catalog v1;
3. references to ten modules in ADR-002 as foundation v1;
4. embedded-only deployment assumptions;
5. the absolute internal-HTTP rejection only for governed federated private runtime contracts.

It must not rewrite the past as if PR #144 defined eleven modules.

## 11. Preserved invariants

The future accepted ADR must preserve REST as public synchronous API, `/api/v1`, explicit tenant, centralized Civitas authorization, backend authorization authority, MCP as delivery surface only, provider-neutral contracts, OpenAPI public contract, RFC 9457 Problem Details, idempotency, optimistic concurrency, no secrets in contracts, no role-shaped routes, no provider-shaped routes, and lifecycle separated from authorization.

## 12. Authority matrix

Unverified until ADR-003 exists and is accepted. Required authorities:

- Logto/upstream IdP: identity, authentication, organizations, memberships, sessions, MFA, upstream federation, token issuance; not effective business authorization.
- Civitas: module catalog, tenant lifecycle, runtime catalog/bindings, public API, AppShell, navigation, permission catalog, role potential, ceilings, activations, PBAC, ABAC/Data Scope, effective allow/deny, provenance, availability, operation resources, audit/correlation, governed MCP.
- Ágora: Planning domain, aggregates, data, invariants, workers, domain events, functional Planning UI, private Planning runtime contract.
- LMS: provider-neutral `lms` boundary for learning delivery, enrollments, progress, grade transactions, course execution; Moodle is not a moduleId.
- Plasma: production tasks, assets, execution state; Planning handoff is immutable intent, not Plasma table ownership.

## 13. Civitas–Ágora–LMS–Plasma matrix

Closure cannot verify the matrix because ADR-003 is absent. This is a closure blocker if the ADR remains missing or ambiguous.

## 14. Public/private API boundary

Required boundary remains unverified:

```text
Browser / mobile / external integration
        |
        v
Civitas public REST API
        |
        v
Civitas authorization + availability
        |
        v
Private federated Planning runtime
```

Expected public API: `/api/v1/o/{organizationId}/planning/...`.

Expected private runtime contract: `planning-runtime/v1`.

## 15. UI/AppShell boundary

Unverified until ADR-003 exists and is accepted. The closure requires one visible login, one AppShell, one organization selector, Civitas global navigation, governed Screen/Action Registry, backend authorization, versioned UI contribution, compatibility/availability checks, and fail-closed incompatible UI behavior.

## 16. Data ownership

Unverified until ADR-003 exists and is accepted. Required minimums:

- Planning domain state: Ágora canonical/storage owner, Civitas public exposure, Ágora mutation semantics, Civitas authorization decision.
- Module catalog/installations/runtime bindings: Civitas canonical/storage owner.
- Identity and sessions: Logto/upstream IdP canonical owner; Civitas business authorization owner.
- LMS state: LMS runtime behind provider-neutral boundary.
- Plasma production state: Plasma.

## 17. Runtime binding vs adapter binding

Unverified until ADR-003 exists and is accepted. The ADR must state `runtime binding != capability adapter binding` and assign implementation to later issues, not #174.

## 18. Service identity requirement

Unverified until ADR-003 exists and is accepted. The ADR must freeze:

```text
network location != trust
user token != service identity
role claim != effective authorization decision
```

Implementation remains #178.

## 19. Federated prohibitions

Unverified until ADR-003 exists and is accepted. Critical prohibitions include second login, second AppShell, browser-to-private-runtime, internal-network trust, full user-token forwarding, role-string authorization, provider-shaped IDs, external-group-to-role direct mapping, Logto as business authorization authority, Ágora activating permissions, runtime redefining Data Scope, shared DB, cross-DB joins, cross-service FKs, direct table access, provider payloads as events, secrets in manifests, private endpoint in public read model, circular sync dependencies, arbitrary internal HTTP, Planning marked active, Planning routes mounted in #174, and Identity/SCIM/seats/Moodle as modules.

## 20. Alternatives rejected

Unverified until ADR-003 exists and is accepted. Required alternatives include Planning as LMS capability, Planning as platform capability, Ágora as provider adapter, embedded Planning baseline, Ágora public API, direct browser access, second login/AppShell, shared database, copying all Planning into Civitas, arbitrary HTTP between modules, Identity Federation/SCIM/Logto/Entitlements/Seats/Moodle as moduleIds.

## 21. Rollback

Unverified until ADR-003 exists and is accepted. Required rollback must preserve `moduleId = planning`, Civitas public API boundary, Civitas authorization authority, and data ownership provenance; suspend runtime binding; mark availability non-executable; fail closed; keep contracts; avoid optimistic fallback; permit later embedded runtime only via explicit migration, compatibility, reconciliation and rollback; never rename to `agora` or expose Ágora URL as public API.

## 22. Impact inventory

Unverified until ADR-003 exists and is accepted. Required impacted contracts for #175+ include module architecture/data/event/navigation docs, ADR-001, ADR-002, REST/API standards, OpenAPI, OpenAPI module fragments, API validators, permission catalog/namespaces, role bundles, frontend CapabilityKey, route catalog, screen/action registry, navigation topology, module manifest/catalog, runtime bindings, availability resolver, operation/event contracts.

## 23. Open decisions

Unverified until ADR-003 exists and is accepted. Future ADR must assign ownerIssue/deadlineGate/blockingFor for UI composition technology, service identity protocol, crypto profile, runtime discovery, health transport, broker, deployment topology, secret manager, private endpoint resolution, adapter technology, and federated-to-embedded migration mechanics.

Normative decisions must not remain open: Planning moduleId, module count, initial deployment mode, product owner, data owner, public API, browser access, second login/AppShell, shared DB, authorization authority, Identity Federation classification, runtime vs adapter binding.

## 24. Downstream issue mapping

Downstream blockers, once ADR-003 is accepted, should map to:

- #175: executable module catalog / Module Manifest v2.
- #176: lifecycle and runtime binding storage.
- #177: availability resolver.
- #178: ModuleExecutionContext and service identity.
- #179: UI composition contract.
- #180: outbox/inbox/operations.
- #181/#182: runtime gateway/adapter.
- #183: Planning OpenAPI.
- #161-#166: authorization catalog, roles, Data Scope, evaluator, Logto plan/apply, CI.
- #192: LMS integration.
- #193: Plasma handoff.
- #154/#155/#156: Identity Federation, SCIM, seats/entitlements.

## 25. Validation results

| Command | Exit | Result | Classification | Introduced by branch |
|---|---:|---|---|---|
| `node scripts/api/validate-api-style.mjs` | 0 | passed | passed | false |
| `node scripts/api/validate-openapi-contract.mjs` | 0 | passed | passed | false |
| `node scripts/api/validate-module-ownership.mjs` | 0 | passed | passed | false |
| `node scripts/api/validate-api-authz-contract.mjs` | 0 | passed | passed | false |
| `node scripts/api/validate-api-contract.mjs` | 0 | passed | passed | false |
| `npm run authz:permission-catalog:validate` | 0 | passed | passed | false |
| `npm run authz:permission-catalog:check` | 0 | passed | passed | false |
| `npm run authz:naming:check` | 1 | failed_preexisting | legacy_naming_unproven_against_origin_main | false |
| `npm run logto:authz:contract-check` | 0 | passed | passed | false |
| `npm test` | 1 | failed_preexisting | legacy_naming_unproven_against_origin_main | false |

The two naming failures cannot be proven against `origin/main` in this checkout because `origin/main` is unavailable. They are not attributed to ADR-003 changes, because ADR-003 is absent and no executable files were modified in this closure pass.

## 26. Review status

`gh` is not installed in this environment, so PR review state, approval, mergeability, checks and unresolved threads could not be observed locally. This independently blocks `READY_TO_CLOSE` because #174 requires explicit architecture acceptance.

## 27. Final recommendation

NOT_READY_TO_CLOSE

Do not close #174 and do not start #175 from this branch. Create or restore the ADR-003 branch containing `docs/adr/ADR-003-module-catalog-v2-federated-runtime.md`, obtain explicit architecture approval, ensure ADR status is exactly `Accepted`, verify the PR against `origin/main`, and keep the final #174 PR documentation-only.
