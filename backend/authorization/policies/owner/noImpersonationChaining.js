"use strict";
const { allow, deny } = require("../policyResult");
const { POLICY_REASON_CODES } = require("../reasonCodes");
module.exports = Object.freeze({ id: "no-impersonation-chaining", version: "2026-07-v1", requiredFacts: [], supportedSurfaces: ["owner"], async evaluate(context) { return context.principal.actorSubject && context.principal.effectiveSubject && context.principal.actorSubject !== context.principal.effectiveSubject ? deny("no-impersonation-chaining", POLICY_REASON_CODES.IMPERSONATION_CHAINING_FORBIDDEN) : allow("no-impersonation-chaining"); } });
