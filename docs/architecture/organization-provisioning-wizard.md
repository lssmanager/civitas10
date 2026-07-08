# Organization Provisioning Wizard

`POST /owner/organizations` is an owner-global bootstrap operation for a Logto organization. Logto remains the canonical source for the current organization, memberships and organization roles. Civitas DB stores only local operational evidence: wizard drafts, request envelopes, operation rows, step history, audit logs, idempotency records, failures and reconciliation status.

## Wizard stages

The owner wizard persists drafts by idempotency key and stage:

1. `canonical` — canonical organization fields that will be sent to Logto.
2. `business` — operational profile/custom-data envelope.
3. `admins` — administrative contacts and their explicitly selected Logto organization roles.
4. `segmentation` — capability metadata for later connector orchestration.
5. `review` — final request envelope and submit state.

Drafts live in `organization_provisioning_drafts`. This table is not a local organization model; it is a resumable request envelope keyed by `idempotency_key`.

## Idempotency and resume

If the client does not provide `idempotencyKey`, Civitas generates one and returns it. The same key is used for:

- the wizard draft;
- the final bootstrap operation;
- operational step history;
- the `idempotency_records` row.

On retry, completed non-replayable external-effect steps are skipped. If `logto.organization.create` completed before a later failure, retry resumes using the stored Logto organization id instead of creating another organization.

## Bootstrap steps

The bootstrap operation records explicit steps:

- `organization.bootstrap.started`
- `logto.organization_roles.list`
- `logto.organization_template.validate`
- `logto.organization.create`
- `logto.organization_jit.email_domains.replace`
- `logto.organization_jit.default_roles.replace`
- `logto.organization_user.assign_role:<contactKey>`

JIT default roles are replaced with exactly the selected role ids. If the owner selects no JIT default roles, Civitas sends an empty role list to Logto instead of inventing a default.

## Owner state

Owner list/detail reads current organization data from Logto. Bootstrap status is displayed separately from operation history with actions such as `resume_bootstrap`, `retry_failed_step`, `mark_reconciled`, and `open_logto_resource`.
