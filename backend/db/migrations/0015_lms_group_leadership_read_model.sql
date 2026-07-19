-- Issue #128: durable LMS group read model for organization_groupleader.
create table if not exists lms_academic_groups (
  id uuid primary key default gen_random_uuid(),
  logto_organization_id varchar(128) not null,
  stable_key varchar(140) not null,
  display_name varchar(180) not null,
  summary text,
  unit_id uuid references organization_units(id) on delete set null,
  status varchar(32) not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lms_academic_groups_status_check check (status in ('active','archived')),
  constraint lms_academic_groups_unique unique (logto_organization_id, id),
  constraint lms_academic_groups_stable_unique unique (logto_organization_id, stable_key)
);
create index if not exists lms_academic_groups_org_status_idx on lms_academic_groups(logto_organization_id, status);
create index if not exists lms_academic_groups_unit_idx on lms_academic_groups(unit_id);

create table if not exists lms_group_members (
  id uuid primary key default gen_random_uuid(),
  logto_organization_id varchar(128) not null,
  group_id uuid not null,
  member_ref varchar(160) not null,
  display_name varchar(180) not null,
  member_type varchar(40) not null,
  status varchar(32) not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lms_group_members_group_fk foreign key (logto_organization_id, group_id) references lms_academic_groups(logto_organization_id, id) on delete cascade,
  constraint lms_group_members_type_check check (member_type in ('student','teacher','support')),
  constraint lms_group_members_status_check check (status in ('active','archived')),
  constraint lms_group_members_unique unique (logto_organization_id, group_id, member_ref, member_type)
);
create index if not exists lms_group_members_org_group_idx on lms_group_members(logto_organization_id, group_id, status);

create table if not exists lms_course_offerings (
  id uuid primary key default gen_random_uuid(),
  logto_organization_id varchar(128) not null,
  group_id uuid not null,
  course_ref varchar(160) not null,
  display_name varchar(180) not null,
  subject_key varchar(120),
  teacher_ref varchar(160),
  status varchar(32) not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lms_course_offerings_group_fk foreign key (logto_organization_id, group_id) references lms_academic_groups(logto_organization_id, id) on delete cascade,
  constraint lms_course_offerings_status_check check (status in ('active','archived')),
  constraint lms_course_offerings_unique unique (logto_organization_id, group_id, course_ref)
);
create index if not exists lms_course_offerings_org_group_idx on lms_course_offerings(logto_organization_id, group_id, status);
