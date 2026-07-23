# P3-005 migration reconciliation preflight

- Branch: codex/issue-180-integration-events-outbox-operations
- Commit SHA: e8d361feeab6d7d2506f7283ecafb8138d0b285d
- Merge-base: unavailable
- Catalog version: 2.0.0
- Catalog hash: 48be8d3d93d233f4c9d4dc5122014680556fcfe76328ec8b49ea5275c2cf60e4
- Redaction: paths-only-no-secret-values

| Primitive | Classification | Responsibility | Tenant identity | Natural keys | Decision |
|---|---|---|---|---|---|
| registry_capabilities | primitive-preserved | technical provider-neutral capabilities | global/control-plane | key | preserve |
| registry_adapters | primitive-preserved | technical adapter implementations | global/control-plane | capability_id + key | preserve |
| registry_connectors | primitive-preserved | configured connector instances | global/control-plane | adapter_id + key | preserve |
| registry_connector_bindings | primitive-referenced | tenant capability-to-connector binding | logto_organization_id | logto_organization_id + capability_id active | reference |
| organization_runtime_state | primitive-referenced | technical mappings and operational state | logto_organization_id | logto_organization_id + capability + state_key | reference |
| operational_operations | primitive-consumer | async operation tracking/idempotency | global/control-plane | id/idempotency_key | compatibility |
| audit_logs | primitive-consumer | audit record sink | global/control-plane | id | compatibility |
| idempotency_records | primitive-consumer | idempotent action records | global/control-plane | idempotency_key | compatibility |
| module_catalog | primitive-extended | module identity control plane | global/control-plane | module_id | extend |
| module_versions | primitive-extended | manifest version control plane | global/control-plane | module_id + semantic_version | extend |
| organization_modules | primitive-extended | tenant module installation lifecycle | logto_organization_id | logto_organization_id + module_id | extend |
| module_runtime_catalog | primitive-extended | business module runtime catalog | global/control-plane | runtime_id | extend |
| organization_module_runtime_bindings | primitive-extended | tenant business runtime binding | logto_organization_id | logto_organization_id + organization_module_id + module_id active | extend |
| module_contract_compatibility | primitive-extended | explicit module/runtime/host compatibility | global/control-plane | module_version_id + runtime_id + versions | extend |

## Blockers

- None in offline structural preflight. Database row-level preflight must run before destructive backfills.
