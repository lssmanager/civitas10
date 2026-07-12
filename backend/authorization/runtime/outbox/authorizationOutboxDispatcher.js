"use strict";
const { getAuthorizationEventDefinition } = require("../authorizationEvents");
function classifyPublishError(error) { return error && (error.permanent || error.unrecoverable) ? "permanent" : "transient"; }
function computeBackoffMs({ attempts = 0, baseDelayMs = 1000, maxDelayMs = 300000, jitterRatio = 0.1 } = {}) {
  const base = Math.min(maxDelayMs, baseDelayMs * 2 ** Math.max(0, attempts));
  return Math.round(base + base * jitterRatio);
}
function toBullMqJob(event) {
  const definition = getAuthorizationEventDefinition(event.eventType);
  return { queueName: definition.queueName, jobName: event.eventType, jobId: `${event.eventType}:${event.aggregateType}:${event.aggregateId}:${event.eventVersion}`, data: { eventId: event.id, eventType: event.eventType, aggregateType: event.aggregateType, aggregateId: event.aggregateId, eventVersion: event.eventVersion, organizationId: event.logtoOrganizationId || null, subjectUserId: event.subjectLogtoUserId || null, payload: event.payload || {} } };
}
function createInMemoryOutboxDispatcherRepository(runtimeRepository) {
  return {
    async claimPending({ workerId, batchSize = 10, now = new Date(), leaseMs = 60000 }) {
      const events = await runtimeRepository.listOutboxEvents();
      const claimed = [];
      for (const event of events) {
        if (claimed.length >= batchSize) break;
        const leaseExpired = event.status === "publishing" && event.claimedAt && new Date(event.claimedAt).getTime() + leaseMs <= now.getTime();
        if ((event.status === "pending" && new Date(event.availableAt || 0) <= now) || leaseExpired) {
          const saved = { ...event, status: "publishing", claimedBy: workerId, claimedAt: now.toISOString(), attempts: Number(event.attempts || 0) + 1, updatedAt: now.toISOString() };
          await runtimeRepository.saveOutboxEvent(saved); claimed.push(saved);
        }
      }
      return claimed;
    },
    markPublished: (event, now = new Date()) => runtimeRepository.saveOutboxEvent({ ...event, status: "published", publishedAt: now.toISOString(), updatedAt: now.toISOString() }),
    markFailed: (event, patch) => runtimeRepository.saveOutboxEvent({ ...event, ...patch, updatedAt: new Date().toISOString() }),
  };
}
function createAuthorizationOutboxDispatcher({ repository, publisher, now = () => new Date() }) {
  async function dispatchBatch({ workerId = "authorization-outbox-dispatcher", batchSize = 25, leaseMs = 60000 } = {}) {
    const events = await repository.claimPending({ workerId, batchSize, now: now(), leaseMs });
    const results = [];
    for (const event of events) {
      try {
        const job = toBullMqJob(event);
        await publisher.publish({ ...event, job });
        await repository.markPublished(event, now());
        results.push({ eventId: event.id, status: "published", job });
      } catch (error) {
        const definition = getAuthorizationEventDefinition(event.eventType);
        const kind = classifyPublishError(error);
        const nextStatus = kind === "permanent" || Number(event.attempts || 0) >= Number(definition.retry.maxAttempts || 5) ? "failed" : "pending";
        const delayMs = computeBackoffMs({ attempts: Number(event.attempts || 0), baseDelayMs: definition.retry.baseDelayMs, maxDelayMs: definition.retry.maxDelayMs });
        await repository.markFailed(event, { status: nextStatus, availableAt: new Date(now().getTime() + delayMs).toISOString(), lastErrorJson: { message: error.message, name: error.name, classification: kind } });
        results.push({ eventId: event.id, status: nextStatus, error: kind });
      }
    }
    return results;
  }
  return { dispatchBatch };
}
module.exports = { createAuthorizationOutboxDispatcher, createInMemoryOutboxDispatcherRepository, toBullMqJob, classifyPublishError, computeBackoffMs };
