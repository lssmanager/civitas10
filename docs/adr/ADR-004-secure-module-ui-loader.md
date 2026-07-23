# ADR-004: Secure module UI loader

Status: Accepted

## Decision
Civitas loads remote UI contributions as host-resolved, immutable, versioned ESM artifacts after validating `civitas-module-ui/v1`, host-approved origin, full asset-manifest integrity, optional signature, design-system version, host API version, module identity and availability. The remote module renders only inside AppShell-owned boundaries and receives a revocable `civitas-module-ui-host/v1` API.

## Options considered
- Native versioned ESM loading: selected for browser baseline, bundler independence at contract level, and direct CSP/integrity control.
- Import maps: deferred; useful for shared dependency pinning but too much runtime graph authority for P3-011.
- Module Federation: rejected as canonical contract because it couples to webpack/runtime sharing semantics.
- Web Components: viable component boundary, not chosen because React focus/error integration and design tokens are stronger through AppShell-owned React boundaries.
- Signed single bundle: compatible profile; P3-011 supports an asset manifest so a single bundle is a one-asset graph.
- iframe: retained only as secondary isolation/fallback, never as primary shell.
- Build-time composition/server-side composition: useful for first-party local modules, not sufficient for federated runtime rollout/rollback.

## Frozen model
Artifact format is immutable ESM with a signed/digested asset graph. The entrypoint is resolved by moduleId, moduleVersion, contributionVersion and host-approved origin registry; never from URL/query/localStorage/runtime prompt. Cache keys include moduleId, moduleVersion, contributionVersion, UI contract version, artifact digest, design-system version and host API version. Rollback may activate only previous verified compatible artifacts, never revoked/quarantined artifacts. CSP forbids wildcard origins, `unsafe-eval`, object embedding and frame ancestors. Style isolation uses scoped host container classes plus Civitas semantic tokens/CSS layers; Shadow DOM is not the default because it can break token inheritance and focus semantics.

## Failure model
Any origin, integrity, signature, compatibility, availability, authorization, timeout or lifecycle failure fails closed, keeps AppShell mounted, reports redacted telemetry, moves focus to an accessible fallback heading and never exposes tokens, ModuleExecutionContext, private endpoints or raw router/global store.
