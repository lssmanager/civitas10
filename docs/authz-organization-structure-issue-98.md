# Issue #98 Organization Units & Groups Core

#98 Core builds on #97 taxonomy IDs and does not create roles, scopes, permissions, Logto memberships, or data-scope assignments. Units answer where a person sits organizationally; memberships and capability-group references can produce `ScopeCandidate` objects, but #95 remains the authority that decides whether a candidate becomes effective data scope.

Unit hierarchies are forests partitioned by `hierarchy_key`: `academic_structure`, `administrative_structure`, `geographic_structure`, `program_structure`, and `team_structure`. Each unit has one parent at most in one hierarchy. The service and migration enforce same-organization, same-hierarchy, allowed parent type, self-parent rejection, advisory locks, recursive CTE path guards, and a deferred constraint trigger.

Unit lifecycle is `draft -> active -> deprecating -> archived`. Draft and archived units do not produce scope candidates, archived units do not accept memberships, and archive is blocked when impact is unknown, children are active, or active memberships exist.

Membership lifecycle is `scheduled`, `active`, `expired`, `revoked`, `archived`. Effective membership queries always evaluate `valid_from` and `valid_until`; security does not depend on an expiration worker. The DB uses a functional unique index over `COALESCE(logto_role_id, '')` so duplicate memberships with a NULL role are not possible.

`guardian_of` is intentionally not a unit membership. There is no canonical student/person identity in the current repository, so #98 Core provides a person-relationship provider/port seam and leaves guardian integration for #95/capability identity work instead of creating a parallel student identity.

Audience definitions use a closed versioned AST with only `and`/`or` and bounded predicates. Stored JSON is never SQL, JavaScript, regex, JSONPath, template code, or an open expression language. Explicit audience memberships require a reason and remain non-authoritative.

Capability group references are capability-first (`organization_capability_group_refs`) and never provider-specific tables such as Moodle groups. External refs are not authorization, secrets are rejected, and connector bindings remain the existing registry authority.

The ScopeCandidate contract includes subject, role provenance, capability, dimension key/value, unit ID, source relationship, valid dates, and structure version. Translation is declarative and platform-owned; it never infers semantics from display names such as "Mathematics".

Tenant and owner HTTP APIs are not exposed because #74 has not promoted active permissions for `org.units.read`, `org.units.manage`, `org.unit_memberships.read`, `org.unit_memberships.manage`, `org.audiences.read`, and `org.audiences.manage`. Route contracts can be wired once #74 decides exact permissions; generic substitutes such as `org.settings.write` are intentionally not used.
