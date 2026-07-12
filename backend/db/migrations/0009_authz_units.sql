-- Issue #98: organization units, memberships, capability groups, audiences, and structure versions.
create table if not exists organization_units (
  id uuid primary key default gen_random_uuid(),
  logto_organization_id varchar(128) not null,
  hierarchy_key varchar(100) not null,
  unit_type varchar(80) not null,
  stable_key varchar(120) not null,
  display_name varchar(180) not null,
  description text,
  parent_unit_id uuid references organization_units(id) on delete restrict,
  dimension_value_id uuid references organization_dimension_values(id) on delete restrict,
  status varchar(32) not null default 'draft',
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_by_logto_user_id varchar(128) not null,
  updated_by_logto_user_id varchar(128) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_units_stable_key_check check (stable_key ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint organization_units_hierarchy_check check (hierarchy_key in ('academic_structure','administrative_structure','geographic_structure','program_structure','team_structure')),
  constraint organization_units_type_check check (unit_type in ('academic_division','academic_department','administrative_department','campus','program','team','custom')),
  constraint organization_units_status_check check (status in ('draft','active','deprecating','archived')),
  constraint organization_units_metadata_object_check check (jsonb_typeof(metadata) = 'object'),
  constraint organization_units_no_self_parent_check check (parent_unit_id is null or parent_unit_id <> id),
  constraint organization_units_org_stable_unique unique (logto_organization_id, stable_key),
  constraint organization_units_org_id_unique unique (logto_organization_id, id)
);
create index if not exists organization_units_org_hierarchy_status_idx on organization_units(logto_organization_id, hierarchy_key, status);
create index if not exists organization_units_org_type_status_idx on organization_units(logto_organization_id, unit_type, status);
create index if not exists organization_units_parent_idx on organization_units(parent_unit_id);
create index if not exists organization_units_dimension_value_idx on organization_units(dimension_value_id);
create index if not exists organization_units_org_sort_idx on organization_units(logto_organization_id, sort_order);

create or replace function organization_units_guard_parent() returns trigger language plpgsql as $$
declare found_cycle boolean;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.logto_organization_id || ':' || new.hierarchy_key, 0));
  if new.parent_unit_id is null then return new; end if;
  if not exists (select 1 from organization_units p where p.id = new.parent_unit_id and p.logto_organization_id = new.logto_organization_id and p.hierarchy_key = new.hierarchy_key and p.status <> 'archived') then raise exception 'organization_unit_parent_invalid'; end if;
  with recursive ancestors as (
    select id, parent_unit_id, array[id] as path from organization_units where id = new.parent_unit_id and logto_organization_id = new.logto_organization_id and hierarchy_key = new.hierarchy_key
    union all
    select p.id, p.parent_unit_id, a.path || p.id from organization_units p join ancestors a on p.id = a.parent_unit_id where p.logto_organization_id = new.logto_organization_id and p.hierarchy_key = new.hierarchy_key and not p.id = any(a.path)
  ) select exists(select 1 from ancestors where id = new.id limit 1) into found_cycle;
  if found_cycle then raise exception 'organization_unit_cycle_detected'; end if;
  return new;
end $$;
drop trigger if exists organization_units_parent_guard_trigger on organization_units;
create constraint trigger organization_units_parent_guard_trigger after insert or update of parent_unit_id, logto_organization_id, hierarchy_key on organization_units deferrable initially deferred for each row execute function organization_units_guard_parent();

create table if not exists organization_unit_memberships (
  id uuid primary key default gen_random_uuid(),
  logto_organization_id varchar(128) not null,
  unit_id uuid not null references organization_units(id) on delete restrict,
  logto_user_id varchar(128) not null,
  logto_role_id varchar(128),
  relationship_type varchar(80) not null,
  valid_from timestamptz not null,
  valid_until timestamptz,
  status varchar(32) not null default 'scheduled',
  assigned_by_logto_user_id varchar(128) not null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_unit_memberships_time_check check (valid_until is null or valid_until > valid_from),
  constraint organization_unit_memberships_status_check check (status in ('scheduled','active','expired','revoked','archived')),
  constraint organization_unit_memberships_relationship_check check (relationship_type in ('leads','teaches','manages','member','supports','studies','assigned_to'))
);
create unique index if not exists organization_unit_memberships_identity_uidx on organization_unit_memberships(unit_id, logto_user_id, relationship_type, coalesce(logto_role_id, ''));
create index if not exists organization_unit_memberships_unit_idx on organization_unit_memberships(unit_id, status);
create index if not exists organization_unit_memberships_org_user_idx on organization_unit_memberships(logto_organization_id, logto_user_id);
create index if not exists organization_unit_memberships_org_status_time_idx on organization_unit_memberships(logto_organization_id, status, valid_from, valid_until);

create table if not exists organization_capability_group_refs (
  id uuid primary key default gen_random_uuid(),
  logto_organization_id varchar(128) not null,
  capability varchar(80) not null,
  connector_binding_id uuid references registry_connector_bindings(id) on delete set null,
  external_type varchar(80) not null,
  external_ref varchar(180) not null,
  stable_key varchar(140) not null,
  display_name_cache varchar(180),
  unit_id uuid references organization_units(id) on delete set null,
  dimension_value_id uuid references organization_dimension_values(id) on delete set null,
  sync_status varchar(40) not null default 'pending',
  last_synced_at timestamptz,
  last_error_json jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_capability_group_refs_capability_check check (capability in ('identity','lms','crm','marketing','support','scheduling','payments','email','storage','analytics','notifications','automation','community')),
  constraint organization_capability_group_refs_no_secret_check check (external_ref !~* '(token|secret|password|jwt|refresh)'),
  constraint organization_capability_group_refs_external_unique unique (logto_organization_id, capability, external_type, external_ref)
);
create index if not exists organization_capability_group_refs_org_capability_idx on organization_capability_group_refs(logto_organization_id, capability, sync_status);

create table if not exists organization_audience_definitions (
  id uuid primary key default gen_random_uuid(),
  logto_organization_id varchar(128) not null,
  stable_key varchar(120) not null,
  display_name varchar(180) not null,
  description text,
  definition_version integer not null default 1,
  dsl_version integer not null default 1,
  definition_json jsonb not null default '{}'::jsonb,
  status varchar(32) not null default 'draft',
  created_by_logto_user_id varchar(128) not null,
  updated_by_logto_user_id varchar(128) not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_audience_definitions_status_check check (status in ('draft','active','deprecating','archived')),
  constraint organization_audience_definitions_dsl_check check (dsl_version = 1),
  constraint organization_audience_definitions_json_object_check check (jsonb_typeof(definition_json) = 'object'),
  constraint organization_audience_definitions_org_stable_unique unique (logto_organization_id, stable_key)
);
create index if not exists organization_audience_definitions_org_status_idx on organization_audience_definitions(logto_organization_id, status);

create table if not exists organization_audience_explicit_memberships (
  id uuid primary key default gen_random_uuid(),
  logto_organization_id varchar(128) not null,
  audience_id uuid not null references organization_audience_definitions(id) on delete restrict,
  member_type varchar(40) not null,
  member_ref varchar(160) not null,
  valid_from timestamptz not null,
  valid_until timestamptz,
  status varchar(32) not null default 'active',
  reason text not null,
  added_by_logto_user_id varchar(128) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_audience_explicit_memberships_time_check check (valid_until is null or valid_until > valid_from),
  constraint organization_audience_explicit_memberships_status_check check (status in ('active','expired','revoked')),
  constraint organization_audience_explicit_memberships_unique unique (audience_id, member_type, member_ref)
);
create index if not exists organization_audience_explicit_memberships_org_audience_idx on organization_audience_explicit_memberships(logto_organization_id, audience_id, status);

create table if not exists organization_structure_versions (
  logto_organization_id varchar(128) primary key,
  unit_graph_version bigint not null default 0,
  membership_version bigint not null default 0,
  audience_version bigint not null default 0,
  updated_at timestamptz not null default now(),
  updated_by_logto_user_id varchar(128),
  reason text
);
