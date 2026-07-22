-- Issue #163: durable AuthorizationScopeAssignment contract guardrails.
-- Production repositories must enforce the same invariants as the service layer:
-- exactly one target among dimension_value_id, unit_id and resource_ref;
-- same-tenant references; active/published resource facts at evaluation time;
-- assignment state lifecycle; and policy snapshot invalidation on changes.

CREATE TABLE IF NOT EXISTS authorization_scope_assignments (
  id text PRIMARY KEY,
  logto_organization_id text NOT NULL,
  logto_user_id text NOT NULL,
  membership_id text,
  logto_role_id text NOT NULL,
  canonical_role_id text NOT NULL,
  capability text NOT NULL,
  scope_kind text NOT NULL CHECK (scope_kind IN ('dimension', 'unit', 'resource')),
  dimension_key text,
  relationship_key text,
  dimension_value_id text,
  unit_id text,
  resource_ref text,
  source_type text NOT NULL,
  source_ref text,
  source_version text NOT NULL,
  state text NOT NULL CHECK (state IN ('active', 'revoked', 'expired')),
  assigned_by_logto_user_id text NOT NULL,
  reason text NOT NULL,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT authorization_scope_assignments_exactly_one_target CHECK (
    ((dimension_value_id IS NOT NULL)::int + (unit_id IS NOT NULL)::int + (resource_ref IS NOT NULL)::int) = 1
  ),
  CONSTRAINT authorization_scope_assignments_valid_window CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE UNIQUE INDEX IF NOT EXISTS authorization_scope_assignments_active_unique
  ON authorization_scope_assignments (logto_organization_id, coalesce(membership_id, logto_user_id), canonical_role_id, capability, scope_kind, coalesce(dimension_key, relationship_key), coalesce(dimension_value_id, unit_id, resource_ref))
  WHERE state = 'active';
