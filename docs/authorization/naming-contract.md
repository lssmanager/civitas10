# Authorization naming contract (#93)

## Canonical names

The importable source of truth is `scripts/authorization/naming-contract.js`. It defines:

| Category | Canonical convention |
| --- | --- |
| Logto organization roles | `organization_*` |
| Tenant core permissions | `org.*` |
| Token organization claim | `organization_id` |
| Tenant routes | `/o/:organizationId/*` |
| Local UX/operational tables | `org_*` |
| API resource | `https://civitas.didaxus.com/api` |

These names are intentionally different because they belong to different surfaces. Do not rename Logto roles to `org_*`, and do not rename tenant core permissions to `organization.*`.

## Commands

From the repository root:

```bash
npm run authz:naming:check
npm run authz:naming:report
npm run test:authz:naming
```

`authz:naming:check` is offline, deterministic, does not call Logto, does not require secrets, and exits non-zero when it finds violations or expired/malformed allowlist entries.

`authz:naming:report` writes `artifacts/authorization-naming-report.json` and prints a short summary. The report is read-only inventory: it does not rewrite code or migrate legacy references.

## Legacy allowlist policy

Legacy entries live in `scripts/authorization/naming-allowlist.js`. Every exception must be exact-file scoped, owned, dated with `removeAfter`, and include a replacement or explicit external/migration reason. Globs such as `backend/**` are rejected by tests and by the check.

## Integration

- #74 owns the permission catalog and role-permission matrix.
- #93 owns syntax, naming conventions, allowlist classification, and repository scanning.
- #87 should import the naming contract before provisioning and combine it with the #74 manifest.
- #88 consumes the `organization_id` claim constant.
- #78 consumes the `/o/:organizationId` route constant.

The scanner is context-aware: it allows Logto/connector downstream names as `external`, migration-only legacy readers through exact allowlist entries, and documentation sections explicitly marked as prohibited examples.
