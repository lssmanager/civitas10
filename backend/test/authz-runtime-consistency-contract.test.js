"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const runtime = require("../authorization/runtime");

function setup() {
  const repository = runtime.createInMemoryAuthorizationRuntimeRepository();
  const versionService = runtime.createAuthorizationVersionService({ repository });
  const outboxService = runtime.createAuthorizationOutboxService({ repository, versionService });
  return { repository, versionService, outboxService };
}

test("version increments serialize as strings and one mutation writes one outbox event atomically", async () => {
  const { repository, versionService, outboxService } = setup();
  const result = await outboxService.mutateWithVersionAndOutbox({ organizationId: "org-A", reason: "unit_membership_changed", event: { eventType: runtime.AUTHORIZATION_EVENT_TYPES.UNIT_CHANGED, aggregateId: "unit-1", payload: { accessToken: "redacted", unitId: "unit-1" } }, mutation: async () => ({ changed: true }) });
  assert.equal(result.versionSnapshot.policyVersion, "2");
  assert.equal(typeof result.versionSnapshot.policyVersion, "string");
  assert.equal(result.outboxEvent.payload.accessToken, undefined);
  assert.equal((await repository.listOutboxEvents()).length, 1);
});

test("rollback restores version and outbox state when mutation fails", async () => {
  const { repository, outboxService } = setup();
  await assert.rejects(() => outboxService.mutateWithVersionAndOutbox({ organizationId: "org-A", reason: "boom", event: { eventType: runtime.AUTHORIZATION_EVENT_TYPES.FEATURE_FLAG_CHANGED, aggregateId: "flag-1" }, mutation: async () => { throw new Error("boom"); } }), /boom/);
  assert.equal((await repository.getVersion("org-A")).policyVersion, "1");
  assert.equal((await repository.listOutboxEvents()).length, 0);
});

test("outbox uniqueness includes aggregate type to avoid namespace collisions", async () => {
  const { repository } = setup();
  await repository.insertOutboxEvent({ eventType: runtime.AUTHORIZATION_EVENT_TYPES.FEATURE_FLAG_CHANGED, aggregateType: "feature_flag", aggregateId: "same", eventVersion: "2", payload: {} });
  await repository.insertOutboxEvent({ eventType: runtime.AUTHORIZATION_EVENT_TYPES.FEATURE_FLAG_CHANGED, aggregateType: "authorization_catalog", aggregateId: "same", eventVersion: "2", payload: {} });
  const duplicate = await repository.insertOutboxEvent({ eventType: runtime.AUTHORIZATION_EVENT_TYPES.FEATURE_FLAG_CHANGED, aggregateType: "feature_flag", aggregateId: "same", eventVersion: "2", payload: {} });
  assert.equal((await repository.listOutboxEvents()).length, 2);
  assert.equal(duplicate.duplicate, true);
});

test("dispatcher claims pending events, publishes durable jobs, and recovers expired leases", async () => {
  const { repository } = setup();
  await repository.insertOutboxEvent({ id: "evt-1", eventType: runtime.AUTHORIZATION_EVENT_TYPES.ROLE_REVOKED, aggregateType: "authorization_role", aggregateId: "role-1", eventVersion: "2", payload: {}, availableAt: "2026-07-12T00:00:00.000Z" });
  const published = [];
  const dispatcherRepository = runtime.createInMemoryOutboxDispatcherRepository(repository);
  const dispatcher = runtime.createAuthorizationOutboxDispatcher({ repository: dispatcherRepository, publisher: { publish: async (event) => published.push(event.job) }, now: () => new Date("2026-07-12T00:00:01.000Z") });
  const result = await dispatcher.dispatchBatch({ workerId: "w1", batchSize: 1 });
  assert.equal(result[0].status, "published");
  assert.equal(published[0].queueName, "priority_commands");
  const [event] = await repository.listOutboxEvents();
  assert.equal(event.status, "published");

  await repository.saveOutboxEvent({ ...event, status: "publishing", claimedAt: "2026-07-12T00:00:00.000Z", claimedBy: "dead-worker" });
  const reconciler = runtime.createAuthorizationOutboxReconciler({ repository, now: () => new Date("2026-07-12T00:02:00.000Z") });
  assert.equal((await reconciler.recoverExpiredClaims({ leaseMs: 1000 })).recovered, 1);
  assert.equal((await repository.listOutboxEvents())[0].status, "pending");
});

test("cache keys are versioned and TTLs are centralized", () => {
  assert.equal(runtime.authorizationCacheKeys.effectiveContext({ organizationId: "org-A", userId: "user-1", policyVersion: "9" }), "civitas:authz:effective:v1:org-A:user-1:9");
  assert.equal(runtime.authorizationCacheKeys.feature({ organizationId: "org-A", featureVersion: "9" }), "civitas:authz:feature:v1:org-A:9");
  assert.equal(runtime.getAuthorizationCacheTtlSeconds("dataScope"), 90);
  assert.throws(() => runtime.authorizationCacheKeys.catalog({ catalogVersion: "bad key" }), /authorization_cache_key_part_invalid/);
});

test("worker reauthorization denies stale policy snapshots", async () => {
  const { versionService } = setup();
  await versionService.increment({ organizationId: "org-A", reason: "role_revoked" });
  const revalidator = runtime.createAsyncAuthorizationRevalidator({ versionService });
  const decision = await revalidator.reauthorize({ operationId: "op-1", organizationId: "org-A", subjectUserId: "user-1", permission: "lms.grades.read", originalDecisionId: "decision-1", originalPolicyVersion: "1", target: { type: "grade", id: "grade-1" } });
  assert.equal(decision.allowed, false);
  assert.equal(decision.reasonCode, "authorization_snapshot_stale");
});

test("feature resolver fails closed for global deny, kill switch, stale snapshot, and tenant enable override", async () => {
  const { versionService } = setup();
  const states = new Map();
  const resolver = runtime.createFeatureAvailabilityResolver({ versionService, featureStateProvider: { getFeatureState: async ({ featureKey }) => states.get(featureKey) || { status: "unknown" } } });
  states.set("flag-global-off", { globalEnabled: false, organizationOverride: "enabled", rolloutAllowed: true, scopePresent: true, entitlementAllowed: true, contextualPoliciesAllowed: true });
  assert.equal((await resolver.resolve({ featureKey: "flag-global-off", organizationId: "org-A", actor: {}, policyVersion: "1" })).reasonCode, "feature_global_disabled");
  states.set("flag-kill", { killSwitch: true, globalEnabled: true });
  assert.equal((await resolver.resolve({ featureKey: "flag-kill", organizationId: "org-A", actor: {}, policyVersion: "1" })).reasonCode, "feature_global_disabled");
  states.set("flag-org-enable", { globalEnabled: true, organizationOverride: "enabled", rolloutAllowed: true, scopePresent: true, entitlementAllowed: true, contextualPoliciesAllowed: true });
  assert.equal((await resolver.resolve({ featureKey: "flag-org-enable", organizationId: "org-A", actor: {}, policyVersion: "1" })).available, false);
  await versionService.increment({ organizationId: "org-A", reason: "feature_changed" });
  assert.equal((await resolver.resolve({ featureKey: "flag-org-enable", organizationId: "org-A", actor: {}, policyVersion: "1" })).reasonCode, "feature_snapshot_stale");
});

test("seat workflow is idempotent, terminal, and worker apply fails closed without connector", async () => {
  const { versionService } = setup();
  const repository = runtime.createInMemorySeatChangeRepository();
  const revalidator = runtime.createAsyncAuthorizationRevalidator({ versionService });
  const workflow = runtime.createSeatChangeWorkflowRuntime({ repository, revalidator });
  const first = await workflow.submit({ requestId: "req-1", organizationId: "org-A", desiredSeats: 10, idempotencyKey: "idem-1" });
  const second = await workflow.submit({ requestId: "req-ignored", organizationId: "org-A", desiredSeats: 99, idempotencyKey: "idem-1" });
  assert.equal(second.idempotent, true);
  assert.equal(second.request.id, first.request.id);
  await workflow.transition({ requestId: "req-1", expectedVersion: 1, toStatus: "approved", actorUserId: "owner-1", decisionId: "decision-1", policyVersion: "1" });
  await workflow.transition({ requestId: "req-1", expectedVersion: 2, toStatus: "scheduled" });
  const apply = await workflow.apply({ requestId: "req-1", operationId: "op-1" });
  assert.equal(apply.applied, false);
  assert.equal(apply.reasonCode, "seat_change_connector_unavailable");
  await workflow.transition({ requestId: "req-1", expectedVersion: 3, toStatus: "applying" });
  await workflow.transition({ requestId: "req-1", expectedVersion: 4, toStatus: "applied" });
  await assert.rejects(() => workflow.transition({ requestId: "req-1", expectedVersion: 5, toStatus: "scheduled" }), /seat_change_already_applied/);
});
