# Civitas Visual System

This repo does not depend on an external visual skill. The canonical visual contract lives here.

## Backbone files

- `src/styles/tokens.css`: stable scales for spacing, typography, radius, control sizes, z-index, max widths and base values.
- `src/styles/theme.css`: light and dark theme variables resolved through `:root[data-theme="light"]` and `:root[data-theme="dark"]`.
- `src/styles/primitives.css`: cards, buttons, fields, alerts, pills, steppers, tables, empty states and KPI grids.
- `src/styles/layout.css`: shell, topbar, navigation, containers, responsive grids and sticky action bars.
- `src/styles/dashboard.css`: thin owner/dashboard compatibility aliases only. Do not add new backbone primitives here.
- `src/styles/index.css`: ordered imports for the visual system.
- `src/shared/ui/index.ts`: the only public barrel for UI primitives.
- `src/layouts/*`: canonical public, owner, organization admin and organization member layouts.

## Theme rule

Components must use variables, not theme-specific branches. To test manually:

```js
document.documentElement.dataset.theme = "light";
document.documentElement.dataset.theme = "dark";
```

Cards, fields, alerts, borders and text consume semantic tokens such as `--civitas-surface`, `--civitas-border`, `--civitas-text`, `--civitas-muted`, `--civitas-success-*`, `--civitas-warning-*` and `--civitas-danger-*`.

## Ownership boundaries

- Public pages use `PublicLayout`.
- Owner global pages use `OwnerLayout`.
- Tenant pages use `OrganizationLayout` with `isAdmin` when the organization-admin surface is required.

Do not mix owner global controls into tenant pages. Logto remains the source of identity, organizations, memberships, roles and tokens; Civitas DB remains the source of local operational state.
