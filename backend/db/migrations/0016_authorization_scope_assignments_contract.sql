-- Issue #163/#205: incremental AuthorizationScopeAssignment contract guardrails.
-- 0010 creates authorization_scope_assignments with the persisted lifecycle column `status`.
-- 0013 adds membership_id/canonical_role_id and the three scheduled/active uniqueness indexes.
-- 0014 adds scope template columns/FK. This migration must be safe on an 0015 database.

ALTER TABLE authorization_scope_assignments
  ADD COLUMN IF NOT EXISTS membership_id varchar(128),
  ADD COLUMN IF NOT EXISTS canonical_role_id varchar(128),
  ADD COLUMN IF NOT EXISTS scope_template_id varchar(160),
  ADD COLUMN IF NOT EXISTS scope_template_version varchar(80);

UPDATE authorization_scope_assignments
   SET membership_id = COALESCE(membership_id, logto_user_id || ':' || logto_role_id),
       canonical_role_id = COALESCE(canonical_role_id, logto_role_id)
 WHERE membership_id IS NULL OR canonical_role_id IS NULL;

ALTER TABLE authorization_scope_assignments
  ALTER COLUMN membership_id SET NOT NULL,
  ALTER COLUMN canonical_role_id SET NOT NULL;

ALTER TABLE authorization_scope_assignments DROP CONSTRAINT IF EXISTS authorization_scope_assignments_state_ck;
ALTER TABLE authorization_scope_assignments DROP CONSTRAINT IF EXISTS authorization_scope_assignments_status_ck;
ALTER TABLE authorization_scope_assignments
  ADD CONSTRAINT authorization_scope_assignments_status_ck CHECK (status IN ('scheduled','active','expired','revoked','invalidated'));

ALTER TABLE authorization_scope_assignments DROP CONSTRAINT IF EXISTS authorization_scope_assignments_exactly_one_target;
ALTER TABLE authorization_scope_assignments DROP CONSTRAINT IF EXISTS authorization_scope_assignments_exactly_one_target_ck;
ALTER TABLE authorization_scope_assignments
  ADD CONSTRAINT authorization_scope_assignments_exactly_one_target_ck CHECK (num_nonnulls(dimension_value_id, unit_id, resource_ref) = 1);

ALTER TABLE authorization_scope_assignments DROP CONSTRAINT IF EXISTS authorization_scope_assignments_valid_window;
ALTER TABLE authorization_scope_assignments DROP CONSTRAINT IF EXISTS authorization_scope_assignments_valid_until_ck;
ALTER TABLE authorization_scope_assignments
  ADD CONSTRAINT authorization_scope_assignments_valid_until_ck CHECK (valid_until IS NULL OR valid_until > valid_from);

DROP INDEX IF EXISTS authorization_scope_assignments_active_unique;

CREATE INDEX IF NOT EXISTS authorization_scope_assignments_membership_role_idx
  ON authorization_scope_assignments(logto_organization_id, membership_id, canonical_role_id, capability);
CREATE INDEX IF NOT EXISTS authorization_scope_assignments_org_user_idx
  ON authorization_scope_assignments(logto_organization_id, logto_user_id, status);
CREATE INDEX IF NOT EXISTS authorization_scope_assignments_org_role_idx
  ON authorization_scope_assignments(logto_organization_id, logto_role_id, status);
CREATE INDEX IF NOT EXISTS authorization_scope_assignments_template_idx
  ON authorization_scope_assignments(scope_template_id, scope_template_version);
