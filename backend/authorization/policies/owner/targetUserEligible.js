"use strict";
const { deny } = require("../policyResult");
const { POLICY_REASON_CODES } = require("../reasonCodes");
module.exports = Object.freeze({ id: "target-user-eligible", version: "2026-07-v1", requiredFacts: ["impersonationProvider"], supportedSurfaces: ["owner"], async evaluate() { return deny("target-user-eligible", POLICY_REASON_CODES.IMPERSONATION_TARGET_INELIGIBLE); } });
