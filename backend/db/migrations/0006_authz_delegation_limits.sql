-- Phase 2 #92 delegation limits: explicit deny-by-default baseline and tenant restrictions.
-- Rollback guidance: disable rows via is_active=false before dropping these tables in a reviewed rollback migration.

CREATE TABLE IF NOT EXISTS role_delegation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grantor_logto_role_id varchar(128) NOT NULL,
  grantor_role_name_cache varchar(160),
  target_logto_role_id varchar(128) NOT NULL,
  target_role_name_cache varchar(160),
  can_assign boolean NOT NULL DEFAULT false,
  can_revoke boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  updated_by_logto_user_id varchar(128) NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT role_delegation_rules_grantor_target_uidx UNIQUE (grantor_logto_role_id, target_logto_role_id),
  CONSTRAINT role_delegation_rules_no_self_chk CHECK (grantor_logto_role_id <> target_logto_role_id)
);

CREATE INDEX IF NOT EXISTS role_delegation_rules_grantor_active_idx ON role_delegation_rules (grantor_logto_role_id, is_active);
CREATE INDEX IF NOT EXISTS role_delegation_rules_target_active_idx ON role_delegation_rules (target_logto_role_id, is_active);
COMMENT ON TABLE role_delegation_rules IS 'Owner-controlled baseline delegation rules. Absence of a row means deny. No permissive seed is inserted by this migration.';

CREATE TABLE IF NOT EXISTS org_delegation_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logto_organization_id varchar(128) NOT NULL,
  grantor_logto_role_id varchar(128) NOT NULL,
  target_logto_role_id varchar(128) NOT NULL,
  assign_disabled boolean NOT NULL DEFAULT false,
  revoke_disabled boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  updated_by_logto_user_id varchar(128) NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT org_delegation_restrictions_org_grantor_target_uidx UNIQUE (logto_organization_id, grantor_logto_role_id, target_logto_role_id),
  CONSTRAINT org_delegation_restrictions_no_self_chk CHECK (grantor_logto_role_id <> target_logto_role_id)
);

CREATE INDEX IF NOT EXISTS org_delegation_restrictions_org_grantor_idx ON org_delegation_restrictions (logto_organization_id, grantor_logto_role_id);
CREATE INDEX IF NOT EXISTS org_delegation_restrictions_org_target_idx ON org_delegation_restrictions (logto_organization_id, target_logto_role_id);
CREATE INDEX IF NOT EXISTS org_delegation_restrictions_active_idx ON org_delegation_restrictions (is_active);
COMMENT ON TABLE org_delegation_restrictions IS 'Tenant restrictions only disable existing baseline delegation capabilities; they never grant delegation.';
