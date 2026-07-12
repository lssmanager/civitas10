# Issue #97 Organizational Taxonomy Contract

The taxonomy model separates platform-owned `taxonomy_dimension_definitions` from tenant-owned `organization_dimension_values`. Tenants can create values for known dimension keys, but cannot create keys, roles, Logto scopes, permissions, adapters, or connector-specific identities.

Lifecycle is `draft -> active -> deprecating -> archived`. Draft values are not data-scope authority. Active values are the only values accepted by the resolver for future #95 assignments. Deprecating values preserve existing references for migration warnings. Archived values are retained for audit, are hidden from operational selectors, and must deny live data access with `taxonomy_value_archived` / `data_scope_assignment_archived_value` semantics.

`organization_taxonomy_state.taxonomy_catalog_version` changes for published catalog semantics. `authorizationPolicyVersion` is incremented through the runtime consistency port only for authorization-affecting changes; display-only changes do not create a policy version. Semantic events enqueue outbox records instead of publishing Redis directly.

Publication is transactional: validate drafts, activate all valid drafts, bump catalog/published versions, enqueue outbox, audit, and return the release. Failed validation rolls back the publication contract.

Hierarchy changes use tenant-scoped parent validation, an advisory transaction lock, recursive CTE with a path guard, a self-FK, and a deferred constraint trigger in migration `0008_authz_taxonomy.sql` to reject cross-tenant, cross-dimension, self-parent, archived-parent, and cycle cases.

The #95 contract is `resolvePublishedDimensionValue({ organizationId, dimensionKey, valueId, capability })`. It returns only UUID-backed active values; labels, stable keys, and external refs are not assignment identities. #98 may link units to `organization_dimension_values.id` with same-organization and compatible-definition rules, but units are not implemented here.

Tenant/owner HTTP routes remain blocked until #74 promotes exact permissions such as planned candidates `owner.taxonomy.definitions.read`, `owner.taxonomy.definitions.manage`, `org.taxonomy.read`, and `org.taxonomy.manage`; generic substitutes are intentionally not used.
