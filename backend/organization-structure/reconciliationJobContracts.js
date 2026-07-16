"use strict";
const RECONCILIATION_JOBS = Object.freeze({ RECONCILE_SUBJECT: "authz.reconcile-subject-scope-candidates", RECONCILE_SOURCE: "authz.reconcile-source-scope-candidates", REVOKE_SOURCE: "authz.revoke-source-derived-scopes", RECOMPUTE_AUDIENCE: "authz.recompute-audience", RECONCILE_CAPABILITY_GROUPS: "authz.reconcile-capability-groups" });
function buildReconciliationJobPayload({ operationId, eventId, organizationId, subjectId, sourceType, sourceIds, expectedVersions = {}, reason }) { return { operationId, eventId, organizationId, subjectId, sourceType, sourceIds, expectedVersions, reason }; }
function assertSafeJobPayload(payload) { const blob = JSON.stringify(payload).toLowerCase(); if (/(bearer|refresh_token|m2m|secret|access_token|audience member list)/.test(blob)) throw new Error("unsafe_reconciliation_job_payload"); return payload; }
module.exports = { RECONCILIATION_JOBS, buildReconciliationJobPayload, assertSafeJobPayload };
