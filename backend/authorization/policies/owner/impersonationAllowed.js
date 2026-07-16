"use strict";
const { deny } = require("../policyResult");
const { POLICY_REASON_CODES } = require("../reasonCodes");
module.exports = Object.freeze({ id: "impersonation-allowed", version: "2026-07-v1", requiredFacts: ["impersonationProvider"], supportedSurfaces: ["owner"], async evaluate() { return deny("impersonation-allowed", POLICY_REASON_CODES.IMPERSONATION_NOT_ALLOWED); } });
