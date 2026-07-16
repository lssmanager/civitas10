"use strict";
const { deny } = require("../../policyResult");
const { POLICY_REASON_CODES } = require("../../reasonCodes");
module.exports = Object.freeze({ id: "seat-request-state-transition", version: "2026-07-v1", requiredFacts: ["seatProvider"], supportedSurfaces: ["owner", "organization"], async evaluate() { return deny("seat-request-state-transition", POLICY_REASON_CODES.SEAT_PROVIDER_UNAVAILABLE); } });
