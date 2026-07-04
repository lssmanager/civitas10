# Civitas Component Rules

## Use primitives first

Before creating a page-local pattern, check `src/shared/ui/index.ts`.

Required primitives:

- `SectionCard` for all surface/card regions.
- `PageHeader` for page titles and descriptions.
- `KpiGrid` + `MetricCard` for operational metrics.
- `StatusPill` for status labels.
- `AlertStrip` for errors, warnings and informational strips.
- `FormField` for every form control with label/hint/error semantics.
- `ActionBar` for page or wizard action groups; use `sticky` for bottom wizard bars.
- `DataTable` for tabular owner data.
- `EmptyState` for empty regions.
- `Stepper` for multi-step flows.

## Do not create parallel variants

If a page needs a card, status, alert, form field, grid, action bar or empty state, extend the existing primitive only when the pattern is reusable. Avoid page-level mini design systems.

## Styling rules

- No hardcoded colors in component files.
- No page-scoped repeated layout CSS.
- Use `civitas-field` for controls inside `FormField`.
- Use `civitas-form-grid` for related two-column form groups.
- Keep rare one-off layout changes in semantic classes inside `styles/primitives.css` or `styles/layout.css`.

## Alerts and errors

Never render raw technical backend messages as unstructured UI. Use `AlertStrip` with a human message and log technical detail to the console or backend logs.
