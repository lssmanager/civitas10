# P3-011 secure module UI loader runbook

Publish immutable ESM artifacts with an asset manifest digest and optional signature. Register only HTTPS origins in the host origin policy and ship CSP from `civitas-module-ui-csp/v1`. Canary by module/contribution version after schema, origin, integrity, signature, compatibility, design-system and host API checks pass.

Rollback uses previous_verified cache records or runtime binding disablement; it must not disable CSP, omit integrity, wildcard origins, accept any version, render a second portal iframe, expose access tokens or ignore module availability. Compromised artifacts are marked revoked/quarantined and never reused.

Go/no-go: P3-011 contract, loader architecture, origin/CSP, integrity, compatibility, rollback, accessibility and no-white-screen checks pass; telemetry includes validation/load/integrity/signature/cache/rollback/mount/fallback outcomes with safe labels only.
