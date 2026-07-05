# Civitas Owner Auth Contract

Owner global screens call `/owner/*` API endpoints and are not organization-scoped. They must request a user access token for the Civitas API resource and must never use a Logto organization token or backend M2M token.

## Environment split

- `VITE_API_URL`: browser network base URL for API requests.
- `VITE_LOGTO_API_RESOURCE`: logical Logto API resource/audience requested through `getAccessToken`; it must be `urn:civitas:api`, not the HTTP API URL.
- Backend `LOGTO_API_RESOURCE`: audience validated by `requireGlobalAccess({ resource: API_RESOURCE, requiredScopes })` for owner/global routes and by `requireOrganizationAccess(...)` for tenant routes.

`VITE_LOGTO_API_RESOURCE` and backend `LOGTO_API_RESOURCE` must match exactly. `VITE_API_URL` is only the browser HTTP base URL and must not be reused as the Logto audience.

## Token rules

- Owner pages use `ownerApiFetch` from `src/api/base.ts`.
- `ownerApiFetch` calls `getAccessToken(APP_ENV.api.resource)`.
- `ownerApiFetch` validates the decoded token before sending it. If `sub === client_id`, the token is client-credentials-like and is rejected locally because owner screens require an authenticated user token.
- Organization pages use `organizationApiFetch` / `getOrganizationToken(organizationId)` only for tenant-scoped endpoints.
- No frontend helper accepts an optional organization id to change token type implicitly.

If owner APIs return 401, the UI should show an actionable owner-session message and log technical response details to devtools, not render raw JWT or backend JSON.
