"use strict";
function createConnectorProvider(capabilities = {}) { return { async isCapabilityEnabled({ capability }) { if (!capability) return { status: "unknown" }; return { status: capabilities[capability] ? "enabled" : "disabled" }; } }; }
module.exports = { createConnectorProvider };
