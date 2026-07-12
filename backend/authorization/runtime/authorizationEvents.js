"use strict";
const { QUEUE_NAMES } = require("../../queues/config");

const AUTHORIZATION_EVENT_TYPES = Object.freeze({
  ROLE_ASSIGNED: "authorization.role.assigned",
  ROLE_REVOKED: "authorization.role.revoked",
  MEMBERSHIP_CHANGED: "authorization.membership.changed",
  CEILING_CHANGED: "authorization.ceiling.changed",
  ACTIVATION_CHANGED: "authorization.activation.changed",
  DELEGATION_CHANGED: "authorization.delegation.changed",
  DATA_SCOPE_ASSIGNMENT_CREATED: "authorization.data_scope_assignment.created",
  DATA_SCOPE_ASSIGNMENT_DELETED: "authorization.data_scope_assignment.deleted",
  DATA_SCOPE_ASSIGNMENT_EXPIRED: "authorization.data_scope_assignment.expired",
  TAXONOMY_CHANGED: "authorization.taxonomy.changed",
  UNIT_CHANGED: "authorization.unit.changed",
  FEATURE_FLAG_CHANGED: "authorization.feature_flag.changed",
  VISUAL_PREFERENCE_CHANGED: "authorization.visual_preference.changed",
  CATALOG_CHANGED: "authorization.catalog.changed",
  BILLING_SEAT_CHANGE_SUBMITTED: "billing.seat_change.submitted",
  BILLING_SEAT_CHANGE_APPROVED: "billing.seat_change.approved",
  BILLING_SEAT_CHANGE_REJECTED: "billing.seat_change.rejected",
  BILLING_SEAT_CHANGE_CANCELLED: "billing.seat_change.cancelled",
  BILLING_SEAT_CHANGE_APPLICATION_REQUESTED: "billing.seat_change.application_requested",
  BILLING_SEAT_CHANGE_APPLIED: "billing.seat_change.applied",
  BILLING_SEAT_CHANGE_FAILED: "billing.seat_change.failed",
});

const transientRetry = Object.freeze({ maxAttempts: 8, baseDelayMs: 1000, maxDelayMs: 300000 });
const commandRetry = Object.freeze({ maxAttempts: 5, baseDelayMs: 500, maxDelayMs: 60000 });
function event(name, aggregateType, queueName, options = {}) {
  return Object.freeze({ name, schemaVersion: "2026-07-v1", aggregateType, queueName, retry: options.retry || transientRetry, requiresReauthorization: Boolean(options.requiresReauthorization), redactPayload: redactAuthorizationEventPayload });
}
const AUTHORIZATION_EVENT_REGISTRY = Object.freeze({
  [AUTHORIZATION_EVENT_TYPES.ROLE_ASSIGNED]: event(AUTHORIZATION_EVENT_TYPES.ROLE_ASSIGNED, "authorization_role", QUEUE_NAMES.PRIORITY_COMMANDS, { requiresReauthorization: true, retry: commandRetry }),
  [AUTHORIZATION_EVENT_TYPES.ROLE_REVOKED]: event(AUTHORIZATION_EVENT_TYPES.ROLE_REVOKED, "authorization_role", QUEUE_NAMES.PRIORITY_COMMANDS, { requiresReauthorization: true, retry: commandRetry }),
  [AUTHORIZATION_EVENT_TYPES.MEMBERSHIP_CHANGED]: event(AUTHORIZATION_EVENT_TYPES.MEMBERSHIP_CHANGED, "authorization_membership", QUEUE_NAMES.PRIORITY_COMMANDS, { requiresReauthorization: true, retry: commandRetry }),
  [AUTHORIZATION_EVENT_TYPES.CEILING_CHANGED]: event(AUTHORIZATION_EVENT_TYPES.CEILING_CHANGED, "authorization_ceiling", QUEUE_NAMES.PRIORITY_COMMANDS, { requiresReauthorization: true }),
  [AUTHORIZATION_EVENT_TYPES.ACTIVATION_CHANGED]: event(AUTHORIZATION_EVENT_TYPES.ACTIVATION_CHANGED, "authorization_activation", QUEUE_NAMES.PRIORITY_COMMANDS, { requiresReauthorization: true }),
  [AUTHORIZATION_EVENT_TYPES.DELEGATION_CHANGED]: event(AUTHORIZATION_EVENT_TYPES.DELEGATION_CHANGED, "authorization_delegation", QUEUE_NAMES.PRIORITY_COMMANDS, { requiresReauthorization: true }),
  [AUTHORIZATION_EVENT_TYPES.DATA_SCOPE_ASSIGNMENT_CREATED]: event(AUTHORIZATION_EVENT_TYPES.DATA_SCOPE_ASSIGNMENT_CREATED, "authorization_scope_assignment", QUEUE_NAMES.PRIORITY_COMMANDS, { requiresReauthorization: true }),
  [AUTHORIZATION_EVENT_TYPES.DATA_SCOPE_ASSIGNMENT_DELETED]: event(AUTHORIZATION_EVENT_TYPES.DATA_SCOPE_ASSIGNMENT_DELETED, "authorization_scope_assignment", QUEUE_NAMES.PRIORITY_COMMANDS, { requiresReauthorization: true }),
  [AUTHORIZATION_EVENT_TYPES.DATA_SCOPE_ASSIGNMENT_EXPIRED]: event(AUTHORIZATION_EVENT_TYPES.DATA_SCOPE_ASSIGNMENT_EXPIRED, "authorization_scope_assignment", QUEUE_NAMES.PRIORITY_COMMANDS, { requiresReauthorization: true }),
  [AUTHORIZATION_EVENT_TYPES.TAXONOMY_CHANGED]: event(AUTHORIZATION_EVENT_TYPES.TAXONOMY_CHANGED, "authorization_taxonomy", QUEUE_NAMES.BACKGROUND_EVENTS, { requiresReauthorization: true }),
  [AUTHORIZATION_EVENT_TYPES.UNIT_CHANGED]: event(AUTHORIZATION_EVENT_TYPES.UNIT_CHANGED, "authorization_unit", QUEUE_NAMES.BACKGROUND_EVENTS, { requiresReauthorization: true }),
  [AUTHORIZATION_EVENT_TYPES.FEATURE_FLAG_CHANGED]: event(AUTHORIZATION_EVENT_TYPES.FEATURE_FLAG_CHANGED, "feature_flag", QUEUE_NAMES.PRIORITY_COMMANDS, { requiresReauthorization: true, retry: commandRetry }),
  [AUTHORIZATION_EVENT_TYPES.VISUAL_PREFERENCE_CHANGED]: event(AUTHORIZATION_EVENT_TYPES.VISUAL_PREFERENCE_CHANGED, "authorization_visual", QUEUE_NAMES.BACKGROUND_EVENTS),
  [AUTHORIZATION_EVENT_TYPES.CATALOG_CHANGED]: event(AUTHORIZATION_EVENT_TYPES.CATALOG_CHANGED, "authorization_catalog", QUEUE_NAMES.BACKGROUND_EVENTS),
  [AUTHORIZATION_EVENT_TYPES.BILLING_SEAT_CHANGE_SUBMITTED]: event(AUTHORIZATION_EVENT_TYPES.BILLING_SEAT_CHANGE_SUBMITTED, "billing_seat_change", QUEUE_NAMES.BACKGROUND_EVENTS),
  [AUTHORIZATION_EVENT_TYPES.BILLING_SEAT_CHANGE_APPROVED]: event(AUTHORIZATION_EVENT_TYPES.BILLING_SEAT_CHANGE_APPROVED, "billing_seat_change", QUEUE_NAMES.PRIORITY_COMMANDS, { requiresReauthorization: true, retry: commandRetry }),
  [AUTHORIZATION_EVENT_TYPES.BILLING_SEAT_CHANGE_REJECTED]: event(AUTHORIZATION_EVENT_TYPES.BILLING_SEAT_CHANGE_REJECTED, "billing_seat_change", QUEUE_NAMES.BACKGROUND_EVENTS),
  [AUTHORIZATION_EVENT_TYPES.BILLING_SEAT_CHANGE_CANCELLED]: event(AUTHORIZATION_EVENT_TYPES.BILLING_SEAT_CHANGE_CANCELLED, "billing_seat_change", QUEUE_NAMES.PRIORITY_COMMANDS, { requiresReauthorization: true }),
  [AUTHORIZATION_EVENT_TYPES.BILLING_SEAT_CHANGE_APPLICATION_REQUESTED]: event(AUTHORIZATION_EVENT_TYPES.BILLING_SEAT_CHANGE_APPLICATION_REQUESTED, "billing_seat_change", QUEUE_NAMES.PRIORITY_COMMANDS, { requiresReauthorization: true, retry: commandRetry }),
  [AUTHORIZATION_EVENT_TYPES.BILLING_SEAT_CHANGE_APPLIED]: event(AUTHORIZATION_EVENT_TYPES.BILLING_SEAT_CHANGE_APPLIED, "billing_seat_change", QUEUE_NAMES.BACKGROUND_EVENTS),
  [AUTHORIZATION_EVENT_TYPES.BILLING_SEAT_CHANGE_FAILED]: event(AUTHORIZATION_EVENT_TYPES.BILLING_SEAT_CHANGE_FAILED, "billing_seat_change", QUEUE_NAMES.BACKGROUND_EVENTS),
});
const SENSITIVE_PAYLOAD_KEYS = new Set(["accessToken", "refreshToken", "bearerToken", "clientSecret", "connectorSecret", "m2mSecret", "secret", "password", "token"]);
function redactAuthorizationEventPayload(payload = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};
  const redacted = {};
  for (const [key, value] of Object.entries(payload)) {
    if (SENSITIVE_PAYLOAD_KEYS.has(key)) continue;
    redacted[key] = value && typeof value === "object" && !Array.isArray(value) ? redactAuthorizationEventPayload(value) : value;
  }
  return redacted;
}
function getAuthorizationEventDefinition(eventType) {
  const definition = AUTHORIZATION_EVENT_REGISTRY[eventType];
  if (!definition) throw Object.assign(new Error("authorization_event_unknown"), { code: "authorization_event_unknown", eventType });
  return definition;
}
module.exports = { AUTHORIZATION_EVENT_TYPES, AUTHORIZATION_EVENT_REGISTRY, getAuthorizationEventDefinition, redactAuthorizationEventPayload };
