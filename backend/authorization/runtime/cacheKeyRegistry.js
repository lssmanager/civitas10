"use strict";
const SAFE_KEY_PART = /^[A-Za-z0-9_.:-]{1,180}$/;
function assertPart(value, field) {
  const stringValue = String(value ?? "");
  if (!SAFE_KEY_PART.test(stringValue)) throw Object.assign(new Error("authorization_cache_key_part_invalid"), { code: "authorization_cache_key_part_invalid", field });
  return stringValue;
}
function key(parts) { return ["civitas", "authz", ...parts].map((part, index) => assertPart(part, `part${index}`)).join(":"); }
const authorizationCacheKeys = Object.freeze({
  effectiveContext: ({ organizationId, userId, policyVersion }) => key(["effective", "v1", organizationId, userId, policyVersion]),
  dataScope: ({ organizationId, userId, policyVersion }) => key(["data-scope", "v1", organizationId, userId, policyVersion]),
  orgConfig: ({ organizationId, configVersion }) => key(["org-config", "v1", organizationId, configVersion]),
  visual: ({ organizationId, visualVersion }) => key(["visual", "v1", organizationId, visualVersion]),
  catalog: ({ catalogVersion }) => key(["catalog", "v1", catalogVersion]),
  feature: ({ organizationId, featureVersion }) => key(["feature", "v1", organizationId, featureVersion]),
});
module.exports = { authorizationCacheKeys, assertPart };
