# Canonical Sources by Domain

Civitas uses one rule for domain authority:

```text
Logto = canonical identity layer
Civitas DB = canonical local operational layer
Everything else = modular capabilities resolved through MCP connectors
```

## Logto

Canonical for:

- identity
- authentication
- organizations
- memberships
- roles
- permissions
- organization context
- tokens

Civitas must not create a parallel organization, membership, role, permission, or RBAC authority in PostgreSQL. Runtime organization context is derived from Logto-backed token/request context and should flow through `req.org` where backend middleware has resolved it.

## Civitas DB

Canonical local operational layer for:

- audit
- sync state
- queues
- connector bindings
- connector configuration metadata
- health checks
- operational errors
- reconciliation state
- technical mappings
- organization runtime state by `logto_organization_id + capability + state_key`
- cross-system operational rules

Civitas DB may keep local records that make operations reliable, observable, idempotent, and auditable. External IDs and integration references should live in `organization_runtime_state` keyed by `logto_organization_id + capability + state_key`. Those rows are local operational state, not replacements for Logto identity data or external provider business objects.

## External capabilities

Resolved by MCP connectors:

- `crm`
- `marketing`
- `lms`
- `community`
- `payments`
- `notifications`
- `support`
- `analytics`

Providers are implementations, not canonical product domains. A capability such as `crm` can be implemented by an adapter such as FluentCRM; `lms` can be implemented by an adapter such as Moodle; `community` can be implemented by an adapter such as BuddyBoss. The product contract should name the capability first and keep provider-specific details behind adapters, operational diagnostics, or documented legacy compatibility fields.

## Why `logto_organization_id` is the local anchor

If Civitas needs to refer to an organization locally, the stable anchor is `logto_organization_id` because Logto owns organization identity and membership context. Local tables may store this value to scope audit rows, operations, connector bindings, role mappings, or technical mappings, but those rows must not become an alternative organization directory.

## Why PostgreSQL does not duplicate RBAC

Logto owns global roles, organization roles, permissions, memberships, and token claims. Civitas may store operational mappings such as downstream role mappings for a capability adapter, but it must not make those mappings authoritative for access to Civitas APIs. Authorization checks should validate Logto-issued tokens and Logto-aligned role names.

## Why providers do not define product structure

Providers change over time. FluentCRM, Moodle, BuddyBoss, WordPress, payment processors, support desks, and analytics systems are interchangeable implementations of capabilities. Civitas product structure should remain stable when an organization swaps adapters. Provider IDs belong in operational references or technical mappings, not in canonical product models.

## Future PR drift check

When reviewing a PR, reject or redesign it if it:

- makes a provider name the primary public contract where a capability name would work;
- creates organizations, memberships, roles, or permissions that compete with Logto;
- stores external live state as local truth without freshness/source metadata;
- adds provider-specific IDs as canonical entities instead of operational mappings;
- bypasses `organization + capability` connector resolution in favor of provider-first lookup;
- stores plaintext secrets instead of a safe secret reference.

Prefer PRs that model external work as `capability + adapter + operational state + technical mapping` and keep Logto as the identity authority.

## Role separation

- `owner_global`: global owner authority for product-wide administration, organization provisioning/configuration, cross-tenant diagnostics, and global operational tooling. It does not represent tenant membership by itself.
- `organization_admin`: Logto organization role for administering resources within one organization.
- `organization_member`: Logto organization role for basic tenant access within one organization.

These roles are not interchangeable. Global owner routes must use global access; tenant routes must use organization context and Logto organization roles/permissions.

## Legacy surfaces and temporary fields

Some existing payloads still expose legacy provider-shaped fields for compatibility. They are allowed temporarily only as operational mappings or diagnostics and must not be treated as canonical product models.

| Legacy field/surface | Temporary status | Guidance |
| --- | --- | --- |
| `provider`, `providerId`, `providerCode`, `providerStatus` | Operational diagnostics | Keep as compatibility/status metadata; prefer capability-first public contracts for new surfaces. |
| `fluentcrm`, `fluentcrmCompanyId`, `fluentcrmContactId` | CRM capability operational mapping | Legacy compatibility only; new reads should prefer `organization_runtime_state` key `crm.company_id` or related capability keys. |
| `wordpress`, `wordpressUserId`, first-login WordPress actions | Legacy/community/auth-adjacent diagnostics | Treat as downstream operational references; WordPress is not the authorization authority. |
| `moodleCourseId` | LMS capability operational mapping | Treat as adapter-specific LMS reference; do not make Moodle the LMS product model. |
| `buddybossMemberId` | Community capability operational mapping | Treat as adapter-specific community reference; do not make BuddyBoss the community product model. |
| Provider-named operational blocks in legacy responses | Compatibility surface | New blocks should be capability-first; legacy blocks should be folded into capability blocks in dependent issues. |

Dependent issues should migrate provider-named response blocks and actions toward capability-first names, and should backfill legacy `customData` runtime references into `organization_runtime_state` where safe, while preserving compatibility until consumers are updated.
