"use strict";
function createFeatureFlagProvider(flags = {}) { return { async evaluateFeature({ feature }) { if (!feature) return { status: "unknown" }; return { status: flags[feature] ? "enabled" : "disabled" }; } }; }
module.exports = { createFeatureFlagProvider };
