-- Owner organization wizard drafts are operational request envelopes only.
-- Logto remains canonical for the current organization; Civitas stores drafts,
-- submit status and reconciliation metadata for resume/retry/audit.
create table if not exists organization_provisioning_drafts (
  idempotency_key varchar(220) primary key,
  current_stage varchar(40) not null default 'canonical',
  stage_payloads jsonb not null default '{}'::jsonb,
  consolidated_payload jsonb not null default '{}'::jsonb,
  actor_json jsonb not null default '{}'::jsonb,
  status varchar(40) not null default 'draft',
  submit_status varchar(40) not null default 'not_submitted',
  logto_organization_id varchar(128),
  last_error_json jsonb,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists organization_provisioning_drafts_status_idx
  on organization_provisioning_drafts(status, submit_status);
create index if not exists organization_provisioning_drafts_logto_org_idx
  on organization_provisioning_drafts(logto_organization_id);
