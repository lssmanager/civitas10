-- P3-010 shared integration-event foundation. Evolves existing operational primitives; no provider payloads or secrets are inserted.
create table if not exists integration_event_schema_registry (
  event_type varchar(180) not null,
  schema_version varchar(80) not null,
  owning_module_id varchar(80) not null,
  owning_capability_id varchar(160),
  lifecycle varchar(32) not null default 'planned',
  sensitivity varchar(32) not null default 'internal',
  payload_schema jsonb not null default '{}'::jsonb,
  allowed_consumers jsonb not null default '[]'::jsonb,
  compatibility_status varchar(40) not null default 'compatible',
  retention_class varchar(40) not null default 'operational',
  max_payload_bytes integer not null default 16384,
  redaction_policy jsonb not null default '{}'::jsonb,
  producer_contract jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(event_type, schema_version),
  constraint integration_event_registry_lifecycle_ck check (lifecycle in ('planned','active','deprecated','removed')),
  constraint integration_event_registry_sensitivity_ck check (sensitivity in ('public','internal','confidential','restricted')),
  constraint integration_event_registry_provider_neutral_ck check (event_type !~* '^(moodle|agora|stripe|matomo|bullmq|redis)\.')
);

create table if not exists integration_outbox_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique,
  event_type varchar(180) not null,
  schema_version varchar(80) not null,
  logto_organization_id varchar(128) not null,
  aggregate_type varchar(120) not null,
  aggregate_id varchar(180) not null,
  aggregate_version varchar(80),
  actor_json jsonb not null,
  correlation_id varchar(160) not null,
  trace_id varchar(160),
  causation_id varchar(160),
  parent_event_id uuid,
  operation_id uuid,
  source_json jsonb not null,
  sensitivity varchar(32) not null,
  payload jsonb not null default '{}'::jsonb,
  state varchar(40) not null default 'pending',
  attempt_count integer not null default 0,
  max_attempts integer not null default 5,
  next_attempt_at timestamptz not null default now(),
  lease_owner varchar(160),
  lease_expires_at timestamptz,
  last_error_class varchar(120),
  last_error_json jsonb,
  published_at timestamptz,
  dead_lettered_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integration_outbox_state_ck check (state in ('pending','claimed','retry_scheduled','published','terminal_failed','dead_lettered','cancelled')),
  constraint integration_outbox_attempts_ck check (attempt_count >= 0 and max_attempts between 1 and 20),
  constraint integration_outbox_payload_redacted_ck check (payload::text !~* '(accessToken|refreshToken|bearer|authorization|password|secret|privateKey|apiKey|cookie)')
);
create index if not exists integration_outbox_claim_idx on integration_outbox_events(state, next_attempt_at, lease_expires_at, created_at);
create index if not exists integration_outbox_tenant_idx on integration_outbox_events(logto_organization_id, event_type, created_at);
create index if not exists integration_outbox_operation_idx on integration_outbox_events(logto_organization_id, operation_id) where operation_id is not null;

create table if not exists integration_inbox_receipts (
  id uuid primary key default gen_random_uuid(),
  consumer_id varchar(160) not null,
  event_id uuid not null,
  event_type varchar(180) not null,
  schema_version varchar(80) not null,
  logto_organization_id varchar(128) not null,
  state varchar(40) not null default 'received',
  attempt_count integer not null default 0,
  lease_owner varchar(160),
  lease_expires_at timestamptz,
  first_received_at timestamptz not null default now(),
  last_received_at timestamptz not null default now(),
  processed_at timestamptz,
  result_digest varchar(128),
  result_reference varchar(200),
  error_class varchar(120),
  error_json jsonb,
  correlation_id varchar(160) not null,
  causation_id varchar(160),
  version integer not null default 1,
  unique(consumer_id, event_id),
  constraint integration_inbox_state_ck check (state in ('received','processing','processed','retryable_failed','terminal_failed','dead_lettered')),
  constraint integration_inbox_attempts_ck check (attempt_count >= 0)
);
create index if not exists integration_inbox_work_idx on integration_inbox_receipts(logto_organization_id, consumer_id, state, lease_expires_at);

create table if not exists integration_dead_letters (
  id uuid primary key default gen_random_uuid(),
  source_kind varchar(20) not null,
  source_id uuid not null,
  event_id uuid not null,
  event_type varchar(180) not null,
  schema_version varchar(80) not null,
  logto_organization_id varchar(128) not null,
  producer varchar(160),
  consumer_id varchar(160),
  attempt_count integer not null,
  terminal_reason_code varchar(140) not null,
  failure_json jsonb not null default '{}'::jsonb,
  correlation_id varchar(160) not null,
  causation_id varchar(160),
  reconciliation_status varchar(40) not null default 'pending_review',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integration_dlq_source_ck check (source_kind in ('outbox','inbox')),
  constraint integration_dlq_reconciliation_ck check (reconciliation_status in ('pending_review','retry_approved','replaying','resolved','discarded','superseded')),
  constraint integration_dlq_failure_redacted_ck check (failure_json::text !~* '(accessToken|refreshToken|bearer|authorization|password|secret|privateKey|apiKey|cookie)')
);
create index if not exists integration_dlq_tenant_idx on integration_dead_letters(logto_organization_id, reconciliation_status, created_at);

alter table operational_operations add column if not exists module_id varchar(80);
alter table operational_operations add column if not exists capability_id varchar(160);
alter table operational_operations add column if not exists operation_state varchar(40) not null default 'accepted';
alter table operational_operations add column if not exists progress_json jsonb not null default '{}'::jsonb;
alter table operational_operations add column if not exists requested_by_json jsonb not null default '{}'::jsonb;
alter table operational_operations add column if not exists executing_principal_json jsonb;
alter table operational_operations add column if not exists correlation_id varchar(160);
alter table operational_operations add column if not exists causation_id varchar(160);
alter table operational_operations add column if not exists remote_operation_ref varchar(200);
alter table operational_operations add column if not exists runtime_binding_version varchar(80);
alter table operational_operations add column if not exists result_json jsonb;
alter table operational_operations add column if not exists problem_json jsonb;
alter table operational_operations add column if not exists version integer not null default 1;
alter table operational_operations add column if not exists accepted_at timestamptz not null default now();
alter table operational_operations add column if not exists queued_at timestamptz;
alter table operational_operations add column if not exists started_at timestamptz;
create index if not exists operational_operations_resource_tenant_idx on operational_operations(logto_organization_id, operation_state, module_id, created_at);
