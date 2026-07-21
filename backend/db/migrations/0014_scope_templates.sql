-- Owner-published scope templates and tenant-local configurations.
CREATE TABLE IF NOT EXISTS owner_scope_templates (
  id varchar(160) NOT NULL,
  version varchar(80) NOT NULL,
  capability varchar(80) NOT NULL,
  strategy varchar(40) NOT NULL,
  allowed_target_kinds jsonb NOT NULL DEFAULT '[]'::jsonb,
  allowed_dimension_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  allowed_relationship_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  allowed_role_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  lifecycle varchar(32) NOT NULL,
  data_scope_semantics_version varchar(80) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, version),
  CONSTRAINT owner_scope_templates_lifecycle_ck CHECK (lifecycle IN ('draft','published','deprecated','archived')),
  CONSTRAINT owner_scope_templates_strategy_ck CHECK (strategy IN ('organization','dimensions','relationships','self','deny')),
  CONSTRAINT owner_scope_templates_json_arrays_ck CHECK (jsonb_typeof(allowed_target_kinds) = 'array' AND jsonb_typeof(allowed_dimension_keys) = 'array' AND jsonb_typeof(allowed_relationship_keys) = 'array' AND jsonb_typeof(allowed_role_keys) = 'array')
);

CREATE TABLE IF NOT EXISTS tenant_scope_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logto_organization_id varchar(128) NOT NULL,
  scope_template_id varchar(160) NOT NULL,
  scope_template_version varchar(80) NOT NULL,
  display_label varchar(180) NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT false,
  configured_values jsonb NOT NULL DEFAULT '[]'::jsonb,
  version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenant_scope_configurations_template_fk FOREIGN KEY (scope_template_id, scope_template_version) REFERENCES owner_scope_templates(id, version) ON DELETE RESTRICT,
  CONSTRAINT tenant_scope_configurations_unique UNIQUE (logto_organization_id, scope_template_id, scope_template_version),
  CONSTRAINT tenant_scope_configurations_values_array_ck CHECK (jsonb_typeof(configured_values) = 'array')
);

ALTER TABLE authorization_scope_assignments
  ADD COLUMN IF NOT EXISTS scope_template_id varchar(160),
  ADD COLUMN IF NOT EXISTS scope_template_version varchar(80);

ALTER TABLE authorization_scope_assignments DROP CONSTRAINT IF EXISTS authorization_scope_assignments_template_fk;
ALTER TABLE authorization_scope_assignments
  ADD CONSTRAINT authorization_scope_assignments_template_fk FOREIGN KEY (scope_template_id, scope_template_version) REFERENCES owner_scope_templates(id, version) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS owner_scope_templates_lifecycle_idx ON owner_scope_templates(lifecycle, capability);
CREATE INDEX IF NOT EXISTS tenant_scope_configurations_org_enabled_idx ON tenant_scope_configurations(logto_organization_id, enabled);
CREATE INDEX IF NOT EXISTS authorization_scope_assignments_template_idx ON authorization_scope_assignments(scope_template_id, scope_template_version);
