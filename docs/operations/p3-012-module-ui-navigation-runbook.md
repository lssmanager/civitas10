# P3-012 module UI navigation runbook

Register only P3-011 validated contributions. The adapter maps validated module UI metadata into the canonical Visual Access Contract shapes for route catalog, screen registry, action registry, navigation and breadcrumbs. It never authorizes, changes lifecycle, activates planned permissions, hardcodes Planning in AppShell or creates a second navigation authority.

Route rollout requires generated inventory parity, unique route/screen/action IDs, tenant-safe route builders and direct-route checks. Disablement/rollback removes the contribution or reverts to previous P3-011 verified metadata; it must not hardcode sidebar entries, use role equality, ignore availability, activate planned permissions or forward tokens.

Diagnostics: compare menu/direct route/breadcrumb/action decisions using organization context, module availability, safe AuthorizationContext, contribution status, compatibility and integrity provenance.
