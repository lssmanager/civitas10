"use strict";
const { deny } = require("../../policyResult");
const { POLICY_REASON_CODES } = require("../../reasonCodes");
module.exports = Object.freeze({ id: "seat-request-approval-eligibility", version: "2026-07-v1", requiredFacts: ["seatProvider"], supportedSurfaces: ["owner"], async evaluate() { return deny("seat-request-approval-eligibility", POLICY_REASON_CODES.SEAT_PROVIDER_UNAVAILABLE); } });
