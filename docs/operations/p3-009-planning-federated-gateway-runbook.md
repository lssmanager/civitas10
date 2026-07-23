# P3-009 Planning federated gateway runbook

Architecture: application callers use `PlanningRemoteApplicationPort`; the runtime transport adapter owns private runtime contract `planning-runtime/v1`, service identity, ModuleExecutionContext transport, exact version binding, bounded retry, circuit, bulkhead, and safe problem normalization.

Configuration: runtime target must come from tenant-scoped `organization_module_runtime_bindings` plus runtime catalog `serviceRef` using `civitas-service`. Service identity and ModuleExecutionContext signing/validation are mandatory. No private endpoint, secret, certificate, user token, cookie, or provider payload may be logged.

Deployment order: ship planned contract, publish compatibility projection, configure service identity, bind a canary organization, verify contract harness and metrics, then enable future consumers. Synchronous calls do not create P3-010 operation resources; asynchronous use cases remain planned for P3-010 delegation.

Policies: total deadline 5000 ms, response timeout 2000 ms, max attempts 3, retry only for safe reads or idempotent writes, circuit opens on classified upstream/transport failures only, bulkhead is per runtime binding.

Incidents: version mismatch, context rejection, tenant mismatch, schema drift, or service identity failure must fail closed and page platform on repeated failures. Emergency mitigation is circuit-open or binding suspension. Rollback must not call public REST, bypass validation, forward user tokens, accept wildcard versions, increase retries unboundedly, expose endpoints, import provider SDKs in controllers, or use fake runtime in production.

Go/no-go: all P3-009 gates, contract tests, redaction checks, no-loopback checks, and compatibility checks green; observability dashboards contain request/failure/latency/retry/circuit/context/tenant/idempotency/concurrency metrics with bounded labels.
