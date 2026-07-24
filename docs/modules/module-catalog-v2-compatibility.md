# Module Catalog v2 compatibility note

## Source of truth

`contracts/modules/module-catalog.v2.json` is the only authored source of truth for the Civitas business module catalog v2. Generated consumers are `contracts/modules/generated/module-catalog-v2.inventory.json`, `contracts/modules/generated/module-catalog-v2.inventory.sha256`, and `contracts/modules/generated/module-catalog-v2.types.ts`.

## Historical lists and registries found

The read-only audit is recorded in `artifacts/module-catalog-v2/audit-matrix.md` with raw command output in `artifacts/module-catalog-v2/audit-raw.txt`. Existing OpenAPI module files, permission catalogs, navigation contracts, authorization runtime availability, operational registries, frontend authz/navigation code, package scripts, and workflows are consumers or compatibility views unless later migrated explicitly.

## Compatibility classifications

- OpenAPI module files are validated consumers of module metadata; they are not the authored catalog.
- Authorization permission catalogs remain permission-contract sources, not business-module catalog sources.
- Navigation and route inventories remain compatibility views and must not activate planned Planning behavior.
- Connector and adapter registries are technical boundaries, not modules.
- Screen Registry, Action Registry, MCP, events, and runtime contributions are symbolic contribution references until implemented by later issues.
- Legacy registries remain legacy pending migration where they still encode old cardinality.

## Naming and aliases

- `billing` is a temporary compatibility alias for `payments`; removal requires evidence of zero consumers.
- `notifications` and `communications` are shared/platform capabilities, not business modules.
- `owner` and `account` are API surfaces, not business modules.
- `analytics` and `reports` remain separate business boundaries.
- `hr`, `scheduling`, and `planning` are incorporated as canonical business modules.
- Planning is a planned/federated business module surfaced through Civitas contracts; this PR does not mount routes, navigation, permissions, runtime bindings, remote UI, endpoints, migrations, or provider integrations.
- Provider/product names such as Ágora, Moodle, Canvas, Plasma, and OpenAI are forbidden in canonical IDs but may appear in allowed compatibility/product-surface metadata.

## Deferred work

Destructive renames are prohibited in this PR. Aliases and replacement metadata may only be removed after a later PR provides explicit zero-consumer evidence and updates all compatibility views.
