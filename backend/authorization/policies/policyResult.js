"use strict";

function allow(policyId, reasonCode = "authorization_allowed", metadata = {}) {
  return Object.freeze({ policyId, outcome: "allow", reasonCode, metadata: sanitizeMetadata(metadata) });
}
function deny(policyId, reasonCode, metadata = {}) {
  return Object.freeze({ policyId, outcome: "deny", reasonCode, metadata: sanitizeMetadata(metadata) });
}
function notApplicable(policyId, reasonCode = "policy_not_applicable", metadata = {}) {
  return Object.freeze({ policyId, outcome: "not_applicable", reasonCode, metadata: sanitizeMetadata(metadata) });
}
function sanitizeMetadata(metadata = {}) {
  const blocked = /token|secret|authorization|claims|email|password/i;
  return Object.freeze(Object.fromEntries(Object.entries(metadata).filter(([key]) => !blocked.test(key))));
}
module.exports = { allow, deny, notApplicable, sanitizeMetadata };
