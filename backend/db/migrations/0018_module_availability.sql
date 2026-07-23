-- P3-006 module availability health/circuit primitives. No runtime endpoints, secrets, or provider payloads are stored.
create table if not exists module_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  logto_organization_id varchar(128) not null,
  target_type varchar(80) not null,
  target_binding_id uuid not null,
  module_id varchar(80) not null references module_catalog(module_id),
  capability_id varchar(160),
  observed_state varchar(40) not null,
  observed_at timestamptz not null,
  expires_at timestamptz not null,
  version integer not null default 1,
  sanitized_reason text,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint module_health_target_chk check (target_type in ('module_runtime_binding','capability_adapter_binding')),
  constraint module_health_state_chk check (observed_state in ('healthy','degraded','unavailable','unknown')),
  constraint module_health_freshness_chk check (expires_at > observed_at),
  constraint module_health_no_sensitive_reason_chk check (sanitized_reason is null or sanitized_reason !~* '(token|secret|password|authorization|bearer|private[_-]?key|api[_-]?key)')
);
create index if not exists module_health_latest_idx on module_health_snapshots(logto_organization_id, module_id, capability_id, target_binding_id, observed_at desc, version desc);

create table if not exists module_circuit_states (
  id uuid primary key default gen_random_uuid(),
  logto_organization_id varchar(128) not null,
  target_type varchar(80) not null,
  target_binding_id uuid not null,
  module_id varchar(80) not null references module_catalog(module_id),
  capability_id varchar(160),
  state varchar(40) not null,
  version integer not null default 1,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint module_circuit_target_chk check (target_type in ('module_runtime_binding','capability_adapter_binding')),
  constraint module_circuit_state_chk check (state in ('closed','open','half_open')),
  unique(logto_organization_id, target_type, target_binding_id)
);
create index if not exists module_circuit_tenant_idx on module_circuit_states(logto_organization_id, module_id, capability_id, state);
