-- Issue #95: Authorization Data Scope Engine assignments, exact target, tenant-scoped refs.
create table if not exists authorization_scope_assignments (
  id uuid primary key default gen_random_uuid(),
  logto_organization_id varchar(128) not null,
  logto_user_id varchar(128) not null,
  logto_role_id varchar(128) not null,
  capability varchar(80) not null,
  scope_kind varchar(40) not null,
  dimension_key varchar(100),
  relationship_key varchar(100),
  dimension_value_id uuid,
  unit_id uuid,
  resource_ref varchar(180),
  source_type varchar(60) not null,
  source_ref varchar(180),
  source_version varchar(80),
  status varchar(32) not null default 'scheduled',
  assigned_by_logto_user_id varchar(128) not null,
  reason text,
  valid_from timestamptz not null,
  valid_until timestamptz,
  revoked_at timestamptz,
  revoked_by_logto_user_id varchar(128),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint authorization_scope_assignments_scope_kind_ck check (scope_kind in ('dimension','unit','resource')),
  constraint authorization_scope_assignments_source_type_ck check (source_type in ('explicit','unit_membership','person_relationship','capability_group','system_migration')),
  constraint authorization_scope_assignments_status_ck check (status in ('scheduled','active','expired','revoked','invalidated')),
  constraint authorization_scope_assignments_capability_ck check (capability in ('identity','lms','crm','marketing','support','scheduling','payments','email','storage','analytics','notifications','automation','community')),
  constraint authorization_scope_assignments_valid_until_ck check (valid_until is null or valid_until > valid_from),
  constraint authorization_scope_assignments_metadata_object_ck check (jsonb_typeof(metadata) = 'object')
);

alter table authorization_scope_assignments drop constraint if exists authorization_scope_assignments_exactly_one_target_ck;
alter table authorization_scope_assignments add constraint authorization_scope_assignments_exactly_one_target_ck check (num_nonnulls(dimension_value_id, unit_id, resource_ref) = 1);

alter table authorization_scope_assignments drop constraint if exists authorization_scope_assignments_semantic_target_ck;
alter table authorization_scope_assignments add constraint authorization_scope_assignments_semantic_target_ck check (
  (scope_kind = 'dimension' and dimension_value_id is not null and dimension_key is not null and relationship_key is null)
  or (scope_kind = 'unit' and unit_id is not null and relationship_key is not null and dimension_key is null)
  or (scope_kind = 'resource' and resource_ref is not null and relationship_key is not null and dimension_key is null)
);

create unique index if not exists organization_dimension_values_id_org_uidx on organization_dimension_values(id, logto_organization_id);
create unique index if not exists organization_units_id_org_uidx on organization_units(id, logto_organization_id);
alter table authorization_scope_assignments drop constraint if exists authorization_scope_assignments_dimension_org_fk;
alter table authorization_scope_assignments add constraint authorization_scope_assignments_dimension_org_fk foreign key (dimension_value_id, logto_organization_id) references organization_dimension_values(id, logto_organization_id) on delete restrict;
alter table authorization_scope_assignments drop constraint if exists authorization_scope_assignments_unit_org_fk;
alter table authorization_scope_assignments add constraint authorization_scope_assignments_unit_org_fk foreign key (unit_id, logto_organization_id) references organization_units(id, logto_organization_id) on delete restrict;

create unique index if not exists authorization_scope_assignments_active_dimension_uidx on authorization_scope_assignments(logto_organization_id, logto_user_id, logto_role_id, capability, dimension_key, dimension_value_id) where scope_kind = 'dimension' and status in ('scheduled','active');
create unique index if not exists authorization_scope_assignments_active_unit_uidx on authorization_scope_assignments(logto_organization_id, logto_user_id, logto_role_id, capability, relationship_key, unit_id) where scope_kind = 'unit' and status in ('scheduled','active');
create unique index if not exists authorization_scope_assignments_active_resource_uidx on authorization_scope_assignments(logto_organization_id, logto_user_id, logto_role_id, capability, relationship_key, resource_ref) where scope_kind = 'resource' and status in ('scheduled','active');
create index if not exists authorization_scope_assignments_org_user_idx on authorization_scope_assignments(logto_organization_id, logto_user_id, status);
create index if not exists authorization_scope_assignments_org_role_idx on authorization_scope_assignments(logto_organization_id, logto_role_id, capability);
create index if not exists authorization_scope_assignments_source_idx on authorization_scope_assignments(source_type, source_ref);
create index if not exists authorization_scope_assignments_dimension_idx on authorization_scope_assignments(logto_organization_id, dimension_key, dimension_value_id);
create index if not exists authorization_scope_assignments_unit_idx on authorization_scope_assignments(logto_organization_id, unit_id);
create index if not exists authorization_scope_assignments_resource_idx on authorization_scope_assignments(logto_organization_id, resource_ref);
