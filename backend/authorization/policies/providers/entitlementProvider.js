"use strict";
function createUnavailableEntitlementProvider() { return { async evaluate() { return { status: "unavailable" }; } }; }
module.exports = { createUnavailableEntitlementProvider };
