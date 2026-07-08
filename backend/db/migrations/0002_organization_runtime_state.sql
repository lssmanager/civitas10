-- Fase 1 runtime state: local operational references by Logto organization + capability + state_key.
-- This table stores external IDs, sync status, health/error metadata and technical mappings.
-- It is not a parallel organization, membership or RBAC model.

create table if not exists organization_runtime_state (
  id uuid primary key default gen_random_uuid(),
  logto_organization_id varchar(128) not null,
  capability varchar(80) not null,
  state_key varchar(160) not null,
  state_value text,
  metadata jsonb not null default '{}'::jsonb,
  source varchar(80) not null default 'organization_runtime_state',
  status varchar(40) not null default 'active',
  last_synced_at timestamptz,
  last_error jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_runtime_state_capability_check check (capability in ('identity','lms','crm','marketing','support','scheduling','payments','email','storage','analytics','notifications','automation','community')),
  constraint organization_runtime_state_key_check check (state_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  constraint organization_runtime_state_no_provider_key_check check (split_part(state_key, '.', 1) not in ('fluentcrm','moodle','buddyboss','wordpress','stripe'))
);

create unique index if not exists organization_runtime_state_org_cap_key_uidx
  on organization_runtime_state(logto_organization_id, capability, state_key);
create index if not exists organization_runtime_state_org_idx
  on organization_runtime_state(logto_organization_id);
create index if not exists organization_runtime_state_capability_idx
  on organization_runtime_state(capability);
create index if not exists organization_runtime_state_org_capability_idx
  on organization_runtime_state(logto_organization_id, capability);
