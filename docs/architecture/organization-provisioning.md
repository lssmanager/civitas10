# Organization Provisioning Authority Boundaries

Organization bootstrap is a global product operation initiated by `owner_global`, but it does not make the owner a tenant member.

## Authority levels

1. **Global product level**
   - `owner_global` may call global owner endpoints such as `POST /owner/organizations`.
   - `owner_global` starts an auditable bootstrap operation.
   - `owner_global` is not automatically assigned to the created organization.
   - `owner_global` is not equivalent to `organization_admin` and must not be treated as tenant-scoped.

2. **Organization administration level**
   - Organization administration roles come from Logto organization roles.
   - Civitas must query Logto Management API for the current role list.
   - The initial tenant role selected in the request must be validated against the current Logto response.
   - If the requested role is absent, provisioning fails with `invalid_initial_organization_role` and includes `availableRoles` from Logto.

3. **Organization membership level**
   - Tenant participation roles also come from Logto organization roles.
   - Civitas does not invent tenant roles and does not create local RBAC.
   - Tenant roles are assigned only through Logto.

## Bootstrap sequence

```text
owner_global actor
  -> starts global auditable operation
  -> creates canonical organization in Logto
  -> queries Logto Management API for current organization roles
  -> validates selected initial tenant role against Logto roles
  -> explicitly adds the first tenant user to the organization
  -> explicitly assigns the selected Logto organization role
  -> records provisioning steps/status in Civitas operational state
```

The backend must not use hardcoded backend role lists as provisioning truth. Local role constants may exist for authorization helpers/tests, but organization bootstrap role validation uses Logto's current Management API response.
