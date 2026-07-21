-- P0 resolution: data scopes bind to organization + membership + canonical role path.
-- No generic mutable role scopes are supported.
ALTER TABLE authorization_scope_assignments
  ADD COLUMN IF NOT EXISTS membership_id varchar(128),
  ADD COLUMN IF NOT EXISTS canonical_role_id varchar(128);

UPDATE authorization_scope_assignments
   SET membership_id = COALESCE(membership_id, logto_user_id || ':' || logto_role_id),
       canonical_role_id = COALESCE(canonical_role_id, logto_role_id)
 WHERE membership_id IS NULL OR canonical_role_id IS NULL;

ALTER TABLE authorization_scope_assignments
  ALTER COLUMN membership_id SET NOT NULL,
  ALTER COLUMN canonical_role_id SET NOT NULL;

DROP INDEX IF EXISTS authorization_scope_assignments_active_dimension_uidx;
DROP INDEX IF EXISTS authorization_scope_assignments_active_unit_uidx;
DROP INDEX IF EXISTS authorization_scope_assignments_active_resource_uidx;
CREATE UNIQUE INDEX IF NOT EXISTS authorization_scope_assignments_active_dimension_uidx ON authorization_scope_assignments(logto_organization_id, membership_id, canonical_role_id, capability, dimension_key, dimension_value_id) WHERE scope_kind = 'dimension' AND status IN ('scheduled','active');
CREATE UNIQUE INDEX IF NOT EXISTS authorization_scope_assignments_active_unit_uidx ON authorization_scope_assignments(logto_organization_id, membership_id, canonical_role_id, capability, relationship_key, unit_id) WHERE scope_kind = 'unit' AND status IN ('scheduled','active');
CREATE UNIQUE INDEX IF NOT EXISTS authorization_scope_assignments_active_resource_uidx ON authorization_scope_assignments(logto_organization_id, membership_id, canonical_role_id, capability, relationship_key, resource_ref) WHERE scope_kind = 'resource' AND status IN ('scheduled','active');
CREATE INDEX IF NOT EXISTS authorization_scope_assignments_membership_role_idx ON authorization_scope_assignments(logto_organization_id, membership_id, canonical_role_id, capability);
