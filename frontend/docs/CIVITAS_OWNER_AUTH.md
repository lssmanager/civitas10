# Civitas Owner Auth Contract

Owner global screens call `/owner/*` API endpoints and are not organization-scoped. They must request a user access token for the Civitas API resource and must never use a Logto organization token or backend M2M token.

## Environment split

- `VITE_API_URL`: browser network base URL for API requests.
- `VITE_API_RESOURCE`: Logto API resource/audience requested through `getAccessToken`. If omitted, it defaults to `VITE_API_URL` for same-resource deployments.
- Backend `API_URL`: audience validated by `requireGlobalAccess({ resource: API_RESOURCE, requiredScopes })` for owner/global routes and by `requireOrganizationAccess(...)` for tenant routes.

`VITE_API_RESOURCE` and backend `API_URL` must match exactly. `VITE_API_URL` may differ when a reverse proxy path and the Logto resource indicator are not the same string.

## Token rules

- Owner pages use `ownerApiFetch` from `src/api/base.ts`.
- `ownerApiFetch` calls `getAccessToken(APP_ENV.api.resource)`.
- `ownerApiFetch` validates the decoded token before sending it. If `sub === client_id`, the token is client-credentials-like and is rejected locally because owner screens require an authenticated user token.
- Organization pages use `organizationApiFetch` / `getOrganizationToken(organizationId)` only for tenant-scoped endpoints.
- No frontend helper accepts an optional organization id to change token type implicitly.

If owner APIs return 401, the UI should show an actionable owner-session message and log technical response details to devtools, not render raw JWT or backend JSON.
