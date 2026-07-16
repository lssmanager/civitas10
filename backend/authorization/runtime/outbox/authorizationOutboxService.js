"use strict";
const { getAuthorizationEventDefinition, redactAuthorizationEventPayload } = require("../authorizationEvents");
function normalizeOutboxEvent(input, versionSnapshot = {}) {
  const definition = getAuthorizationEventDefinition(input.eventType);
  const payload = definition.redactPayload ? definition.redactPayload(input.payload || {}) : redactAuthorizationEventPayload(input.payload || {});
  return {
    eventType: definition.name,
    aggregateType: input.aggregateType || definition.aggregateType,
    aggregateId: String(input.aggregateId),
    eventVersion: String(input.eventVersion || versionSnapshot.policyVersion || "1"),
    logtoOrganizationId: input.organizationId || input.logtoOrganizationId || null,
    subjectLogtoUserId: input.subjectUserId || input.subjectLogtoUserId || null,
    payload: { schemaVersion: definition.schemaVersion, policyVersion: versionSnapshot.policyVersion, catalogVersion: versionSnapshot.catalogVersion, visualVersion: versionSnapshot.visualVersion, ...payload },
  };
}
function createAuthorizationOutboxService({ repository, versionService }) {
  async function mutateWithVersionAndOutbox({ organizationId, reason, actorUserId, event, bumpCatalog = false, bumpVisual = false, mutation }) {
    return repository.transaction(async () => {
      const mutationResult = mutation ? await mutation() : null;
      const versionSnapshot = await versionService.increment({ organizationId, reason, actorUserId, bumpCatalog, bumpVisual });
      const outboxEvent = await repository.insertOutboxEvent(normalizeOutboxEvent(event, versionSnapshot));
      await repository.audit({ action: "authorization_runtime_event_enqueued", organizationId, actorUserId, eventType: event.eventType, aggregateId: event.aggregateId, policyVersion: versionSnapshot.policyVersion });
      return { mutationResult, versionSnapshot, outboxEvent };
    });
  }
  return { normalizeOutboxEvent, mutateWithVersionAndOutbox };
}
module.exports = { createAuthorizationOutboxService, normalizeOutboxEvent };
