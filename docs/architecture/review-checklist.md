# Architecture Review Checklist

Use this checklist for PRs that touch identity, organizations, roles, operational state, connectors, adapters, external IDs, or owner/tenant surfaces.

## Canonical sources

- [ ] Does the PR keep Logto as the canonical source for identity?
- [ ] Does the PR avoid creating organizations parallel to Logto?
- [ ] Does the PR avoid creating memberships or RBAC parallel to Logto?
- [ ] Is every local organization reference anchored by `logto_organization_id`?

## Capability-first

- [ ] Does the PR model `crm`, `lms`, `payments`, `community`, `notifications`, `support`, `analytics`, etc. as capabilities?
- [ ] Does the PR avoid exposing provider-first lookup as the primary public contract?
- [ ] Does the provider appear only as an interchangeable adapter implementation?
- [ ] Does operational connector resolution start from `organization + capability`?

## Roles

- [ ] Is `owner_global` kept separate from tenant roles?
- [ ] Does `owner_global` remain global owner authority rather than tenant membership?
- [ ] Do `organization_admin` and `organization_member` remain Logto organization roles?
- [ ] Do role names remain aligned with Logto?

## Operational state

- [ ] Does Civitas DB store local operational state rather than external canonical truth?
- [ ] Do external IDs live as technical mappings or operational references?
- [ ] Are live provider checks labeled with freshness/source metadata?
- [ ] Are secrets kept out of plaintext `config` fields?

## Legacy compatibility

- [ ] Are legacy fields documented?
- [ ] Does the PR avoid expanding legacy provider-shaped surfaces?
- [ ] Does any provider-specific payload remain compatibility-only?
- [ ] Is there a migration path toward capability-first naming where needed?
