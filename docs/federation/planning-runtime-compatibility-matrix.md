# Planning runtime compatibility matrix

Projection for P3-009. The canonical source remains `module_contract_compatibility`; this document is generated evidence for the planned foundation primitive.

| Civitas adapter | Private runtime contract | ModuleExecutionContext | Planning manifest | Runtime binding | Supported runtime versions | Status | Deprecation | Rollout |
|---|---|---|---|---|---|---|---|---|
| planning-gateway-adapter/v1 | planning-runtime/v1 | civitas-module-execution-context/v1 | planning 0.1.0 planned | organization_module_runtime_bindings.version exact | planning-runtime/v1 | compatible | none | planned |
| planning-gateway-adapter/v1 | planning-runtime/v0 | civitas-module-execution-context/v1 | planning 0.1.0 planned | n/a | planning-runtime/v0 | incompatible | n/a | blocked |
| planning-gateway-adapter/v1 | planning-runtime/v2 | civitas-module-execution-context/v1 | planning 0.1.0 planned | n/a | planning-runtime/v2 | verification_required | n/a | planned |

Rollout is canary by organization runtime binding. Rollback is circuit-open or binding suspension; never REST loopback, user-token forwarding, fake runtime, unsigned context, or wildcard version acceptance.
