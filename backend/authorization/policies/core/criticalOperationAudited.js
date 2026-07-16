"use strict";
const { allow, deny } = require("../policyResult");
const { POLICY_REASON_CODES } = require("../reasonCodes");
const POLICY_ID = "critical-operation-audited";
module.exports = Object.freeze({ id: POLICY_ID, version: "2026-07-v1", requiredFacts: ["auditReadinessProvider"], supportedSurfaces: ["owner", "organization"], async evaluate(context) {
  const provider = context.providers?.auditReadinessProvider;
  if (!provider?.isAuditSinkAvailable) return deny(POLICY_ID, POLICY_REASON_CODES.POLICY_PROVIDER_MISSING);
  const sink = await provider.isAuditSinkAvailable({ routeId: context.request.routeId, action: context.facts.auditIntent?.action });
  if (sink.status !== "available") return deny(POLICY_ID, POLICY_REASON_CODES.AUDIT_SINK_UNAVAILABLE);
  const intent = context.facts.auditIntent;
  if (!intent) return deny(POLICY_ID, POLICY_REASON_CODES.AUDIT_INTENT_MISSING);
  if (intent.reasonRequired && !intent.reason) return deny(POLICY_ID, POLICY_REASON_CODES.CRITICAL_OPERATION_REASON_REQUIRED);
  if (intent.idempotencyRequired && !intent.idempotencyKey) return deny(POLICY_ID, POLICY_REASON_CODES.CRITICAL_OPERATION_IDEMPOTENCY_REQUIRED);
  return allow(POLICY_ID);
}});
