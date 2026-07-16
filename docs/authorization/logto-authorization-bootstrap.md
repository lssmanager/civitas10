# Logto authorization bootstrap (#87)

## Scope and source of truth

The bootstrap imports the #74 authorization manifest through `scripts/logto/canonical-contract-loader.js` and the #93 naming contract through `scripts/authorization/naming-contract.js`. It does not define a second permission catalog, does not define a `ROLE_SCOPES_MAP`, and does not provision permissions that are absent from the #74 registry.

Official Logto references used for this implementation:

- Authorization docs (`https://docs.logto.io/authorization`) describe API resources, roles, permissions/scopes, global vs organization authorization, and organization templates.
- RBAC docs (`https://docs.logto.io/authorization/role-based-access-control`) state API resources are identified by a resource indicator URI and permissions/scopes are linked to API resources.
- Organization template docs (`https://docs.logto.io/authorization/organization-template`) define organization role/permission template behavior.
- Organization-level API resource docs (`https://docs.logto.io/authorization/organization-level-api-resources`) define organization-context API resource usage.
- Management API OpenAPI (`https://openapi.logto.io/`) documents resource, role, organization role, resource-scope, and JWT customizer endpoints used by the adapter layer.
- Custom token claims docs (`https://docs.logto.io/developers/custom-token-claims` and `https://docs.logto.io/developers/custom-token-claims/create-script`) are treated as a separate flow from RBAC bootstrap.

## Commands

```bash
npm run logto:authz:contract-check
npm run logto:authz -- check-rbac
npm run logto:authz -- plan-rbac artifacts/logto-authz-plan.json
LOGTO_BOOTSTRAP_ALLOW_APPLY=true npm run logto:authz -- apply-rbac artifacts/logto-authz-plan.json
npm run logto:authz -- check-custom-claims
npm run logto:authz -- plan-custom-claims
```

`apply-rbac` is implemented and tested with fakes, but must not be run against the real Logto tenant unless explicitly authorized. It requires an approved plan file, a matching contract hash, a matching remote fingerprint, credentials, and `LOGTO_BOOTSTRAP_ALLOW_APPLY=true`.

## Environment variables

- `LOGTO_ENDPOINT`: Logto issuer base URL, HTTPS.
- `LOGTO_MANAGEMENT_API_RESOURCE`: Logto Management API resource, HTTPS and distinct from Civitas API resource.
- `LOGTO_M2M_APP_ID`: M2M application ID; no default.
- `LOGTO_M2M_APP_SECRET`: M2M application secret; no default and never logged.
- `LOGTO_CIVITAS_API_RESOURCE`: must equal `https://civitas.didaxus.com/api`.
- `LOGTO_BOOTSTRAP_MODE`: optional CLI default.
- `LOGTO_BOOTSTRAP_MAX_CONCURRENCY`: positive integer.
- `LOGTO_BOOTSTRAP_TIMEOUT_MS`: positive integer.
- `LOGTO_BOOTSTRAP_MAX_RETRIES`: positive integer.

Never put real secrets in frontend, `.env.example`, fixtures, snapshots, logs, or docs.

## Plan model and drift

The deterministic plan contains:

- schema/contract version;
- contract hash;
- target environment;
- remote fingerprint;
- resource operations;
- permissions create/update/noop/conflicts/unmanaged;
- global role create/assignment/noop/conflicts;
- organization role create/assignment/noop/conflicts;
- custom claims placeholder;
- destructive operations, always empty for normal apply;
- warnings.

Drift is classified as missing, metadata drift, assignment drift, unmanaged, type/resource conflict, dangerous, legacy-known, or noop. Unmanaged objects and extra assignments are reported and preserved; normal apply never deletes scopes, roles, assignments, resources, or unknown remote objects.

## Idempotency and partial execution

Apply executes only operations from the approved plan. Before any mutation it validates local contracts again, compares `contractHash`, and verifies the remote fingerprint. A second execution after successful synchronization should produce a noop-only plan and zero mutating calls.

Each operation result records operation ID, phase, target type, target ID, fingerprint, status, attempt, retryability, and timestamps. If execution fails halfway, the bootstrap records applied and failed operations, does not attempt destructive rollback, and expects the operator to reread remote state and generate a new plan.

## Retry, rate limit, and security

The Management API client uses client credentials against the Management API resource, caches the M2M token in memory, refreshes before expiry, applies request timeouts, retries 429/408/5xx with Retry-After/exponential backoff/jitter, and does not retry permanent 4xx. Logs and errors pass through redaction so Authorization headers, access tokens, client secrets, refresh tokens, and custom JWT secrets are not emitted.

## Custom claims

Custom token claims are separate from RBAC. The current plan allows only:

- `https://civitas.didaxus.com/claims/organization_role_ids`
- `https://civitas.didaxus.com/claims/authz_contract_version`

The flow does not add scopes, effective permissions, ceilings, activations, data scopes, student/section/subject data, navigation preferences, PII, or secrets. `apply-custom-claims` remains blocked until the Logto script context and #88/#90 requirements are verified.

## Recovery and operations

1. Run `npm run logto:authz:contract-check` in CI; it is offline and requires no credentials.
2. Run `check-rbac` locally or in a protected environment. Without M2M credentials, it only validates local contracts and warns that remote drift was skipped.
3. Run `plan-rbac` with M2M credentials in a protected environment and review the redacted plan.
4. Confirm no destructive operations are present.
5. Run `apply-rbac` only after explicit authorization.
6. If apply fails, preserve the result, reread remote state, and generate a new plan rather than retrying the old stale plan blindly.

## Known blockers for follow-up issues

- #88/#90 must finalize whether custom claim role IDs are available and safe in the token context.
- #92/#94/#95 remain out of scope; delegation limits, entitlement overlays, and data scopes are not encoded into Logto scopes here.
- #100 seat workflow permissions remain planned unless #74 later marks them active with real consumers.
