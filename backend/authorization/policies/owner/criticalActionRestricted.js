"use strict";
const { allow, deny } = require("../policyResult");
const { POLICY_REASON_CODES } = require("../reasonCodes");
module.exports = Object.freeze({ id: "critical-action-restricted", version: "2026-07-v1", requiredFacts: [], supportedSurfaces: ["owner"], async evaluate(context) { return context.principal.actorSubject && context.principal.actorSubject !== context.principal.effectiveSubject ? deny("critical-action-restricted", POLICY_REASON_CODES.CRITICAL_ACTION_RESTRICTED) : allow("critical-action-restricted"); } });
