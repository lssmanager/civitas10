-- P3-005 module control plane primitives. Preserves registry_* and organization_runtime_state responsibilities.
create table if not exists module_catalog (
  module_id varchar(80) primary key,
  kind varchar(40) not null,
  business_owner varchar(160) not null,
  catalog_status varchar(40) not null,
  catalog_version varchar(40) not null,
  catalog_hash varchar(64) not null,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint module_catalog_id_provider_neutral_chk check (module_id !~ '^(agora|moodle|canvas|plasma|openai)\.'),
  constraint module_catalog_status_chk check (catalog_status in ('proposed','planned','active','deprecated','removed'))
);

create table if not exists module_versions (
  id uuid primary key default gen_random_uuid(),
  module_id varchar(80) not null references module_catalog(module_id),
  semantic_version varchar(40) not null,
  manifest_schema_version varchar(80) not null,
  manifest_hash varchar(64) not null,
  deployment_mode varchar(40) not null,
  contract_status varchar(40) not null,
  data_ownership jsonb not null default '{}'::jsonb,
  contract_refs jsonb not null default '{}'::jsonb,
  compatibility_policy varchar(160) not null,
  manifest_snapshot jsonb not null,
  provenance jsonb not null default '{}'::jsonb,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint module_versions_semver_chk check (semantic_version ~ '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$'),
  constraint module_versions_deployment_chk check (deployment_mode in ('embedded','federated')),
  constraint module_versions_status_chk check (contract_status in ('proposed','planned','active','deprecated','removed')),
  unique(module_id, semantic_version),
  unique(module_id, manifest_hash)
);

create table if not exists organization_modules (
  id uuid primary key default gen_random_uuid(),
  logto_organization_id varchar(128) not null,
  module_id varchar(80) not null references module_catalog(module_id),
  module_version_id uuid not null references module_versions(id),
  lifecycle varchar(40) not null default 'disabled',
  version integer not null default 1,
  actor_logto_user_id varchar(128) not null,
  reason text not null,
  correlation_id varchar(160),
  operational_provenance jsonb not null default '{}'::jsonb,
  installed_at timestamptz,
  lifecycle_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_modules_lifecycle_chk check (lifecycle in ('disabled','provisioning','active','degraded','suspended','decommissioning')),
  unique(logto_organization_id, module_id)
);
create index if not exists organization_modules_org_idx on organization_modules(logto_organization_id, module_id, lifecycle);

create table if not exists module_runtime_catalog (
  id uuid primary key default gen_random_uuid(),
  runtime_id varchar(120) not null unique,
  module_id varchar(80) not null references module_catalog(module_id),
  module_owner varchar(160) not null,
  deployment_mode varchar(40) not null,
  service_ref text,
  runtime_contract_version varchar(120) not null,
  expected_audience varchar(160),
  service_identity_required boolean not null default false,
  health_policy jsonb not null default '{}'::jsonb,
  secrets_ref varchar(255),
  compatibility_metadata jsonb not null default '{}'::jsonb,
  runtime_status varchar(40) not null default 'planned',
  provenance jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint module_runtime_deployment_chk check (deployment_mode in ('embedded','federated')),
  constraint module_runtime_status_chk check (runtime_status in ('planned','available','suspended','deprecated','removed')),
  constraint module_runtime_no_secret_ref_value_chk check (secrets_ref is null or secrets_ref !~* '(password|token|secret=|api[_-]?key|client[_-]?secret|bearer|jwt)')
);
create index if not exists module_runtime_catalog_module_idx on module_runtime_catalog(module_id, runtime_status);

create table if not exists module_contract_compatibility (
  id uuid primary key default gen_random_uuid(),
  module_version_id uuid not null references module_versions(id),
  runtime_id uuid not null references module_runtime_catalog(id),
  host_contract_version varchar(120) not null,
  runtime_contract_version varchar(120) not null,
  ui_contract_version varchar(120),
  compatibility_status varchar(40) not null,
  compatibility_range varchar(120) not null,
  policy varchar(160) not null,
  evidence jsonb not null default '{}'::jsonb,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint module_contract_compat_status_chk check (compatibility_status in ('compatible','deprecated_compatible','incompatible','upgrade_required','verification_required'))
);

create unique index if not exists module_contract_compatibility_identity_uidx on module_contract_compatibility(module_version_id, runtime_id, host_contract_version, runtime_contract_version, coalesce(ui_contract_version,''));

create table if not exists organization_module_runtime_bindings (
  id uuid primary key default gen_random_uuid(),
  logto_organization_id varchar(128) not null,
  organization_module_id uuid not null references organization_modules(id),
  runtime_id uuid not null references module_runtime_catalog(id),
  module_id varchar(80) not null references module_catalog(module_id),
  selected_contract_version varchar(120) not null,
  expected_contract_version varchar(120) not null,
  status varchar(40) not null default 'planned',
  is_executable boolean not null default false,
  version integer not null default 1,
  actor_logto_user_id varchar(128) not null,
  reason text not null,
  correlation_id varchar(160),
  operational_config jsonb not null default '{}'::jsonb,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_module_runtime_binding_status_chk check (status in ('planned','bound','suspended','removed'))
);
create unique index if not exists organization_module_runtime_active_uidx on organization_module_runtime_bindings(logto_organization_id, organization_module_id, module_id) where is_executable = true and status = 'bound';
create index if not exists organization_module_runtime_org_idx on organization_module_runtime_bindings(logto_organization_id, module_id, status);

-- Fail closed preflight marker for ambiguous primitive mappings before future destructive backfills.
do $$ begin
  if exists (
    select 1 from registry_connector_bindings b
    where b.is_active = true and b.status = 'active'
    group by b.logto_organization_id, b.capability_id having count(*) > 1
  ) then raise exception 'MODULE_MIGRATION_DUPLICATE_BINDING: multiple active connector bindings per organization + capability'; end if;
end $$;
