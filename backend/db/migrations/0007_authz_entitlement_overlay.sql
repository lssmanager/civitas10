-- Phase 2 #94 entitlement overlay. Rollback: drop trigger/function, activations,
-- limits, and authorization_policy_versions only after disabling overlay enforcement.

CREATE TABLE IF NOT EXISTS authorization_policy_versions (
  logto_organization_id varchar(128) PRIMARY KEY,
  version bigint NOT NULL DEFAULT 1,
  catalog_version varchar(80),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by_logto_user_id varchar(128),
  reason text
);

CREATE TABLE IF NOT EXISTS org_role_entitlement_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logto_organization_id varchar(128) NOT NULL,
  logto_role_id varchar(128) NOT NULL,
  role_name_cache varchar(160),
  permission_key varchar(180) NOT NULL,
  allowed boolean NOT NULL DEFAULT false,
  locked boolean NOT NULL DEFAULT false,
  policy_version bigint NOT NULL,
  set_by_logto_user_id varchar(128) NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT org_role_entitlement_limits_org_role_perm_uidx UNIQUE (logto_organization_id, logto_role_id, permission_key),
  CONSTRAINT org_role_entitlement_limits_id_org_role_perm_uidx UNIQUE (id, logto_organization_id, logto_role_id, permission_key)
);

CREATE INDEX IF NOT EXISTS org_role_entitlement_limits_org_role_idx ON org_role_entitlement_limits (logto_organization_id, logto_role_id);
CREATE INDEX IF NOT EXISTS org_role_entitlement_limits_org_perm_idx ON org_role_entitlement_limits (logto_organization_id, permission_key);
CREATE INDEX IF NOT EXISTS org_role_entitlement_limits_allowed_idx ON org_role_entitlement_limits (allowed);
CREATE INDEX IF NOT EXISTS org_role_entitlement_limits_policy_version_idx ON org_role_entitlement_limits (policy_version);

CREATE TABLE IF NOT EXISTS org_role_permission_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logto_organization_id varchar(128) NOT NULL,
  logto_role_id varchar(128) NOT NULL,
  role_name_cache varchar(160),
  permission_key varchar(180) NOT NULL,
  entitlement_limit_id uuid NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  policy_version bigint NOT NULL,
  set_by_logto_user_id varchar(128) NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT org_role_permission_activations_org_role_perm_uidx UNIQUE (logto_organization_id, logto_role_id, permission_key),
  CONSTRAINT org_role_permission_activations_limit_fk FOREIGN KEY (entitlement_limit_id) REFERENCES org_role_entitlement_limits(id) ON DELETE RESTRICT,
  CONSTRAINT org_role_permission_activations_limit_identity_fk FOREIGN KEY (entitlement_limit_id, logto_organization_id, logto_role_id, permission_key) REFERENCES org_role_entitlement_limits(id, logto_organization_id, logto_role_id, permission_key) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS org_role_permission_activations_org_role_idx ON org_role_permission_activations (logto_organization_id, logto_role_id);
CREATE INDEX IF NOT EXISTS org_role_permission_activations_org_perm_idx ON org_role_permission_activations (logto_organization_id, permission_key);
CREATE INDEX IF NOT EXISTS org_role_permission_activations_enabled_idx ON org_role_permission_activations (enabled);
CREATE INDEX IF NOT EXISTS org_role_permission_activations_policy_version_idx ON org_role_permission_activations (policy_version);

CREATE OR REPLACE FUNCTION enforce_tenant_activation_within_owner_ceiling()
RETURNS trigger AS $$
BEGIN
  IF NEW.enabled = true AND NOT EXISTS (
    SELECT 1 FROM org_role_entitlement_limits l
    WHERE l.id = NEW.entitlement_limit_id
      AND l.logto_organization_id = NEW.logto_organization_id
      AND l.logto_role_id = NEW.logto_role_id
      AND l.permission_key = NEW.permission_key
      AND l.allowed = true
  ) THEN
    RAISE EXCEPTION 'tenant_activation_exceeds_owner_ceiling';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenant_activation_within_owner_ceiling ON org_role_permission_activations;
CREATE CONSTRAINT TRIGGER trg_tenant_activation_within_owner_ceiling
AFTER INSERT OR UPDATE OF enabled, entitlement_limit_id, logto_organization_id, logto_role_id, permission_key
ON org_role_permission_activations
DEFERRABLE INITIALLY IMMEDIATE
FOR EACH ROW EXECUTE FUNCTION enforce_tenant_activation_within_owner_ceiling();
