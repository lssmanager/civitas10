-- Issue #97: platform-owned taxonomy definitions and tenant-owned organization values.
create table if not exists taxonomy_dimension_definitions (
  id uuid primary key default gen_random_uuid(),
  dimension_key varchar(100) not null unique,
  display_name varchar(160) not null,
  description text,
  value_kind varchar(40) not null,
  hierarchy_allowed boolean not null default false,
  multi_assignment_allowed boolean not null default false,
  is_active boolean not null default true,
  contract_version varchar(80) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint taxonomy_dimension_definitions_key_check check (dimension_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  constraint taxonomy_dimension_definitions_known_key_check check (dimension_key in ('academic.section','academic.subject','academic.grade_level','organization.campus','organization.department','administration.function')),
  constraint taxonomy_dimension_definitions_kind_check check (value_kind in ('enumeration','hierarchy')),
  constraint taxonomy_dimension_definitions_no_provider_check check (split_part(dimension_key, '.', 1) not in ('moodle','buddyboss','stripe','wordpress','fluentcrm','logto')),
  constraint taxonomy_dimension_definitions_no_scope_role_check check (dimension_key !~ '(scope|role|permission)')
);
create index if not exists taxonomy_dimension_definitions_active_idx on taxonomy_dimension_definitions(is_active);

create table if not exists taxonomy_dimension_capabilities (
  id uuid primary key default gen_random_uuid(),
  dimension_definition_id uuid not null references taxonomy_dimension_definitions(id) on delete cascade,
  capability varchar(80) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint taxonomy_dimension_capabilities_capability_check check (capability in ('identity','lms','crm','marketing','support','scheduling','payments','email','storage','analytics','notifications','automation','community')),
  constraint taxonomy_dimension_capabilities_no_provider_check check (capability not in ('moodle','buddyboss','stripe','wordpress','fluentcrm','logto')),
  constraint taxonomy_dimension_capabilities_def_cap_unique unique (dimension_definition_id, capability)
);
create index if not exists taxonomy_dimension_capabilities_capability_idx on taxonomy_dimension_capabilities(capability, is_active);

create table if not exists organization_dimension_values (
  id uuid primary key default gen_random_uuid(),
  logto_organization_id varchar(128) not null,
  dimension_definition_id uuid not null references taxonomy_dimension_definitions(id) on delete restrict,
  dimension_key_cache varchar(100) not null,
  stable_key varchar(120) not null,
  display_name varchar(180) not null,
  description text,
  parent_value_id uuid references organization_dimension_values(id) on delete restrict,
  external_ref varchar(180),
  status varchar(32) not null default 'draft',
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_by_logto_user_id varchar(128) not null,
  updated_by_logto_user_id varchar(128) not null,
  published_at timestamptz,
  published_by_logto_user_id varchar(128),
  deprecated_at timestamptz,
  deprecated_until timestamptz,
  archived_at timestamptz,
  archived_by_logto_user_id varchar(128),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_dimension_values_stable_key_check check (stable_key ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint organization_dimension_values_status_check check (status in ('draft','active','deprecating','archived')),
  constraint organization_dimension_values_metadata_object_check check (jsonb_typeof(metadata) = 'object'),
  constraint organization_dimension_values_external_ref_no_secret_check check (external_ref is null or external_ref !~* '(token|secret|password|jwt|refresh)'),
  constraint organization_dimension_values_no_self_parent_check check (parent_value_id is null or parent_value_id <> id),
  constraint organization_dimension_values_org_def_stable_unique unique (logto_organization_id, dimension_definition_id, stable_key),
  constraint organization_dimension_values_org_def_id_unique unique (logto_organization_id, dimension_definition_id, id)
);
create index if not exists organization_dimension_values_org_def_status_idx on organization_dimension_values(logto_organization_id, dimension_definition_id, status);
create index if not exists organization_dimension_values_org_dim_status_idx on organization_dimension_values(logto_organization_id, dimension_key_cache, status);
create index if not exists organization_dimension_values_parent_idx on organization_dimension_values(parent_value_id);
create index if not exists organization_dimension_values_external_ref_idx on organization_dimension_values(logto_organization_id, dimension_definition_id, external_ref) where external_ref is not null;
create index if not exists organization_dimension_values_org_status_sort_idx on organization_dimension_values(logto_organization_id, status, sort_order);

create or replace function organization_dimension_values_guard_parent() returns trigger language plpgsql as $$
declare found_cycle boolean;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.logto_organization_id || ':' || new.dimension_key_cache, 0));
  if new.parent_value_id is null then return new; end if;
  if not exists (select 1 from organization_dimension_values p where p.id = new.parent_value_id and p.logto_organization_id = new.logto_organization_id and p.dimension_definition_id = new.dimension_definition_id and p.status <> 'archived') then
    raise exception 'taxonomy_parent_invalid';
  end if;
  with recursive ancestors as (
    select id, parent_value_id, array[id] as path from organization_dimension_values where id = new.parent_value_id and logto_organization_id = new.logto_organization_id and dimension_definition_id = new.dimension_definition_id
    union all
    select p.id, p.parent_value_id, a.path || p.id from organization_dimension_values p join ancestors a on p.id = a.parent_value_id where p.logto_organization_id = new.logto_organization_id and p.dimension_definition_id = new.dimension_definition_id and not p.id = any(a.path)
  ) select exists(select 1 from ancestors where id = new.id limit 1) into found_cycle;
  if found_cycle then raise exception 'taxonomy_cycle_detected'; end if;
  return new;
end $$;
drop trigger if exists organization_dimension_values_parent_guard_trigger on organization_dimension_values;
create constraint trigger organization_dimension_values_parent_guard_trigger after insert or update of parent_value_id, logto_organization_id, dimension_definition_id on organization_dimension_values deferrable initially deferred for each row execute function organization_dimension_values_guard_parent();

create table if not exists organization_taxonomy_state (
  logto_organization_id varchar(128) primary key,
  taxonomy_catalog_version bigint not null default 0,
  published_version bigint not null default 0,
  status varchar(40) not null default 'draft',
  last_published_at timestamptz,
  last_published_by_logto_user_id varchar(128),
  updated_at timestamptz not null default now(),
  constraint organization_taxonomy_state_status_check check (status in ('draft','published','migration_required'))
);

create table if not exists taxonomy_presets (
  id uuid primary key default gen_random_uuid(),
  preset_key varchar(100) not null,
  version varchar(80) not null,
  display_name varchar(160) not null,
  status varchar(40) not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint taxonomy_presets_key_version_unique unique (preset_key, version)
);
create table if not exists taxonomy_preset_values (
  id uuid primary key default gen_random_uuid(),
  preset_id uuid not null references taxonomy_presets(id) on delete cascade,
  dimension_key varchar(100) not null,
  stable_key varchar(120) not null,
  display_name varchar(180) not null,
  parent_stable_key varchar(120),
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  constraint taxonomy_preset_values_preset_dim_stable_unique unique (preset_id, dimension_key, stable_key)
);
