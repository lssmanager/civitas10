"use strict";
const { deny } = require("../policyResult");
const { POLICY_REASON_CODES } = require("../reasonCodes");
module.exports = Object.freeze({ id: "target-organization-valid", version: "2026-07-v1", requiredFacts: ["impersonationProvider"], supportedSurfaces: ["owner"], async evaluate() { return deny("target-organization-valid", POLICY_REASON_CODES.RESOURCE_NOT_FOUND_OR_NOT_ACCESSIBLE); } });
