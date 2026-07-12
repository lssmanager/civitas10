"use strict";
const { createEntitlementPolicyProvider } = require("../../entitlements");
function createUnavailableEntitlementProvider() { return { async evaluate() { return { status: "unavailable" }; }, async evaluateSnapshot() { return { status: "unavailable" }; } }; }
module.exports = { createUnavailableEntitlementProvider, createEntitlementPolicyProvider };
