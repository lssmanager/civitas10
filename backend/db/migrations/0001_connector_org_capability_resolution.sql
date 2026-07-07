-- Fase 1 connectors: operational resolution is canonical by Logto organization + capability.
-- Existing tables keep distinct meanings:
-- registry_capabilities = global capability catalog/contracts.
-- registry_adapters = global adapter catalog per capability.
-- registry_connectors = configured connector instances (non-sensitive config + secrets_ref only).
-- registry_connector_bindings = tenant-scoped binding from logto_organization_id + capability to one connector.

alter table registry_connector_bindings
  add column if not exists capability_id uuid references registry_capabilities(id) on delete cascade;

update registry_connector_bindings b
set capability_id = a.capability_id
from registry_connectors c
join registry_adapters a on a.id = c.adapter_id
where b.connector_id = c.id
  and b.capability_id is null;

alter table registry_connector_bindings
  alter column capability_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'registry_bindings_tenant_scope_check'
      and conrelid = 'registry_connector_bindings'::regclass
  ) then
    alter table registry_connector_bindings
      add constraint registry_bindings_tenant_scope_check
      check (scope_type <> 'tenant' or logto_organization_id is not null) not valid;
  end if;
end $$;

alter table registry_connector_bindings
  validate constraint registry_bindings_tenant_scope_check;

create index if not exists registry_bindings_org_capability_idx
  on registry_connector_bindings(logto_organization_id, capability_id);

create unique index if not exists registry_bindings_active_org_capability_uidx
  on registry_connector_bindings(logto_organization_id, capability_id)
  where is_active = true and status = 'active';
