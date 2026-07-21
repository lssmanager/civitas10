# Issue #154 — Logto Identity Federation Phase 0 Discovery

## Status

**discovery_status:** incomplete_remote_verification

Remote observation was not performed because LOGTO_IDENTITY_DISCOVERY_ALLOW_REMOTE_READ=true was not enabled. The discovery completed static repository inspection, generated a read-only probe harness, and produced pending remote test matrices. No Logto or upstream IdP mutation was executed.

## Baseline

- baseRef: codex/discovery-issue-154-logto-federation
- baseSha: a51769d914b7cc831908d45115b46101fcc2bbe9
- foundation144MergeSha: a51769d914b7cc831908d45115b46101fcc2bbe9
- executionTimestamp: 2026-07-21T23:20:20.970Z
- workingTreeState at generation: see provenance; branch contains only allowed discovery artifacts/harness/test changes.

The container has no usable origin remote or local main branch. The local baseline work contains the PR #144 merge SHA and the ancestor check passed.

## Conclusion

**G. No fue posible observar el estado remoto; permanece verification_required.**

Do not declare #154 ready for implementation. Static code proves a write-capable Management API client and legacy JIT/default role assumptions exist, but it does not prove remote Logto version, edition, Enterprise SSO availability, JIT connector shape, upstream identities, groups, or Custom Token Script context.

## Authorities frozen for discovery

- Logto / upstream IdP: identity, authentication, organizations, memberships, sessions, MFA, upstream OIDC/SAML and token issuance.
- Civitas: permission catalog/lifecycle, canonical role potential, Owner Ceilings, Tenant Activations, PBAC, ABAC/Data Scope, effective authorization, reason codes, provenance, authorization audit, mapping approval and governed reconciliation.
- Forbidden: external group -> direct canonical role assignment.

Accepted conceptual sequence only: external identity evidence -> normalized claim -> versioned mapping candidate -> canonical role candidate -> Owner Ceiling -> Tenant Activation -> approval/policy -> Data Scope -> effective decision -> active-only materialization in Logto. This discovery implements none of that sequence.

## Static findings

- Admin-org and Student-org are present in backend/services/logtoManagement.js as legacy organization role names. Treat as legacy_jit_role_model and legacy_default_role_assignment; blocked until #162/#165.
- Current provisioning can call write methods for organization creation, JIT email domains, JIT default roles, membership creation, role assignment, user creation/update and removals. Treat as write_capable_management_client and migration_required; none were executed.
- scripts/logto/bootstrap-custom-token-claims.js states Custom Token Script context remains unverified; do not emit groups or use tokens as a directory database.

## Remote read-only endpoints pending

See management-api-capability-matrix.json and endpoint-evidence.redacted.json. Pending endpoints include organization details/JIT, SSO connectors, users, memberships, roles, identities, session/sign-in metadata, connector metadata, custom token metadata and hooks.

## Claims and groups

All upstream identity/group availability booleans remain null with verification_required. Absence of remote evidence must not be converted to false. Completeness is unknown; therefore destructive reconciliation is prohibited.

Rule: claimsComplete != true -> destructive reconciliation prohibited. That means no role removal, membership removal, Data Scope release, deactivation due to missing groups, or treating partial groups as desired state.

## Correlation recommendation

Preferred conceptual correlation: connectionId + upstream issuer/provider identity + immutable upstream subject. If Logto does not expose that tuple, #154 is blocked until upstream directory or SCIM evidence can provide it. Do not use display name, unverified email, mutable username, group name or connector name as primary correlation.

## Fallback recommendation

Use a provider-neutral adapter boundary, conceptually ExternalDirectoryClaimsReader, if Logto cannot expose required upstream claims/groups. Candidate providers are Microsoft Graph, Google Admin SDK / Directory API, Okta API, generic OIDC UserInfo, SCIM desired-state records, directory broker, and manual mapping/import. No fallback is implemented or selected globally in Gate 1.

## Relations to dependent issues

- #161: no invented identity.* permissions.
- #162: no Admin-org, Student-org, or external group names as canonical roles.
- #163: external attributes do not directly become Data Scope.
- #164: future mapping engine is not an authorization evaluator.
- #165: discovery executes no apply; Logto materializes only active-only governed outputs later.
- #166: future CI must detect direct external-group-to-role mapping, unknown roles, partial claims removal and discovery writes.
- #155: SCIM group is not canonical role, organization unit, cohort or Data Scope.
- #156: identity observed != membership active != seat allocated != role materialized != authorization allowed.
- #174: Identity Federation remains a platform capability, not moduleId identity/oidc/saml/scim/logto.
- #180: long-running directory fetch, reconciliation, role materialization, mass deprovision and credential rotation need operation resources/outbox-inbox.

## Artifacts

- provenance.json
- repository-static-inventory.json
- management-api-capability-matrix.json
- endpoint-evidence.redacted.json
- claim-access-matrix.json
- correlation-identifier-matrix.json
- group-completeness-matrix.json
- custom-token-context-matrix.json
- fallback-options.json
- blockers.json
- decision-summary.json
- follow-up-issue-drafts.md
