"use strict";
class PolicyConfigurationError extends Error { constructor(message, details = {}) { super(message); this.name = "PolicyConfigurationError"; this.details = details; } }
module.exports = { PolicyConfigurationError };
