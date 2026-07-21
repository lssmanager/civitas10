# Civitas Code and Repository Style

## Purpose

A shared style reduces cognitive load and allows automated tools to detect architectural drift. This standard borrows the discipline of mature extensible platforms while defining rules appropriate to Civitas Node.js, TypeScript/JavaScript, React, SQL, YAML, JSON, and Markdown.

## Repository text format

- UTF-8 without BOM.
- Unix LF line endings.
- Exactly one newline at end of every text file.
- No trailing whitespace.
- Spaces, never tabs, except where a format requires tabs.
- No secrets, tokens, credentials, personal data, or production identifiers in examples.

`.editorconfig`, formatter, lint, and CI are enforcement mechanisms; prose alone is insufficient.

## Naming

- Files and directories use project-consistent kebab-case unless framework conventions require otherwise.
- JavaScript/TypeScript variables and functions use `camelCase`.
- Types/classes use `PascalCase`.
- Constants use descriptive `UPPER_SNAKE_CASE` only for true constants.
- Canonical IDs use lowercase dotted namespaces, such as `lms.courses.read`.
- Provider names are prohibited in canonical domain IDs.
- Boolean names express predicates: `isActive`, `hasMore`, `requiresDataScope`.

## JavaScript and TypeScript

- Prefer small explicit modules and dependency injection.
- Validate all external inputs at the boundary.
- Avoid implicit `any`, untyped provider payloads, and unchecked casts.
- Do not catch errors only to discard context.
- Do not expose internal error messages to clients.
- Async functions must have bounded external calls and normalized failure handling.
- Domain/application code cannot import Express, React, provider SDKs, or database transport details.

## HTTP code

- Router: composition and middleware order.
- Controller: transport translation only.
- Application service: use-case orchestration.
- Domain: invariants and provider-neutral behavior.
- Repository/adapter: infrastructure implementation.
- Presenter/problem mapper: public response translation.

No role-string authorization, raw SQL, or provider SDK calls in controllers.

## React and frontend

- Screens and actions register through the Visual Access Contract.
- Components do not invent permissions or infer authorization from hidden controls.
- Data-fetching code uses generated/typed API contracts where available.
- Loading, empty, denied, degraded, and error states are explicit.
- Accessibility and responsive behavior are part of completion, not polish.

## SQL and migrations

- Migrations are versioned, deterministic, reviewable, and forward-safe.
- Tenant-scoped tables include canonical organization identity or a validated tenant foreign key.
- Unique constraints and indexes include tenant scope where identifiers are not global.
- Avoid destructive cascade behavior for audit/history.
- JSONB is used for validated extension metadata, not as an indefinite replacement for stable relational structure.
- Secrets are references, never stored in general metadata.

## YAML, JSON, and OpenAPI

- Two-space indentation.
- Stable key ordering where practical.
- No duplicate keys.
- `$ref` is preferred over copied schemas.
- Every OpenAPI operation has a unique `operationId` and required `x-civitas-*` metadata.
- Examples must be synthetic and safe.

## Markdown

- One H1 per document.
- Headings form a logical hierarchy.
- Fenced code blocks specify a language when known.
- Links use descriptive text.
- Normative terms (`MUST`, `MUST NOT`, `SHOULD`) are used consistently.
- Documents state authority/status and link to their sources of truth.

## Testing style

- Test names describe behavior and boundary.
- Security tests include both allowed and denied paths.
- Tenant isolation tests use at least two organizations.
- Provider adapters have contract tests against the provider-neutral port.
- Snapshot tests do not replace semantic assertions.
- Tests do not depend on production services or credentials.

## Commit and PR quality

- A commit has one coherent purpose.
- Generated artifacts are deterministic.
- PR descriptions state motivation, architecture, security/tenancy, compatibility, validation, and known limitations.
- Documentation and contracts change in the same PR as the behavior they govern.

## Enforcement

At minimum, CI checks:

- final newline and trailing whitespace;
- OpenAPI contract structure;
- operation/module ownership;
- authorization metadata;
- provider leakage in canonical paths;
- forbidden secret-like examples;
- route/OpenAPI drift as runtime registries mature.
