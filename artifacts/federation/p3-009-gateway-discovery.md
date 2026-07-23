# P3-009 gateway discovery

- Branch: codex/issue-179-planning-remote-application-port
- HEAD: bcaf077c1be54860e39878a81dfc3e08de386efe
- P3-006 provenance: local ModuleAvailabilityResolver at bcaf077c1be54860e39878a81dfc3e08de386efe.
- P3-008 provenance: prerequisite completion through ModuleExecutionContext/service identity infrastructure added for this stacked branch.
- P3-010 provenance: existing local artifacts under artifacts/integration; synchronous gateway preserves and does not duplicate outbox/operations.

Decisions: consume module control plane runtime bindings/compatibility and P3-006 circuit state; extend problem mapping and security gates; replace ad-hoc transport/retry with an injectable private runtime adapter; keep fake runtime test-only.
