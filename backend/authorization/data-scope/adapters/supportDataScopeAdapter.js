"use strict";
module.exports = { createUnavailableDataScopeAdapter(capability) { return { capability, contractVersion: "blocked", unavailable: true }; } };
