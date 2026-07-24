-- P3-006 forward-only hardening for databases that already applied 0018.
-- Existing unsafe provenance cannot be trusted or inferred; replace only disallowed provenance with an explicit empty object.
update module_health_snapshots
   set provenance = '{}'::jsonb
 where jsonb_typeof(provenance) <> 'object'
    or (provenance - array['source','checkId','observedBy','resolverVersion','catalogHash','moduleManifestHash','reasonCode']) <> '{}'::jsonb
    or provenance::text ~* '(token|secret|password|authorization|bearer|cookie|headers|request|response|body|providerpayload|payload|localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.|stack)';

update module_circuit_states
   set provenance = '{}'::jsonb
 where jsonb_typeof(provenance) <> 'object'
    or (provenance - array['source','checkId','observedBy','resolverVersion','catalogHash','moduleManifestHash','reasonCode']) <> '{}'::jsonb
    or provenance::text ~* '(token|secret|password|authorization|bearer|cookie|headers|request|response|body|providerpayload|payload|localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.|stack)';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'module_health_provenance_no_private_or_stack_chk') then
    alter table module_health_snapshots
      add constraint module_health_provenance_no_private_or_stack_chk
      check (provenance::text !~* '(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.|stack)');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'module_circuit_provenance_no_private_or_stack_chk') then
    alter table module_circuit_states
      add constraint module_circuit_provenance_no_private_or_stack_chk
      check (provenance::text !~* '(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.|stack)');
  end if;
end $$;
