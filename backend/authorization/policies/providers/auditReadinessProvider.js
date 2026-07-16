"use strict";
function createAuditReadinessProvider({ available = true } = {}) {
  return { async isAuditSinkAvailable() { return { status: available ? "available" : "unavailable" }; } };
}
module.exports = { createAuditReadinessProvider };
