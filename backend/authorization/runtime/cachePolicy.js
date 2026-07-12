"use strict";
const AUTHORIZATION_CACHE_TTLS_SECONDS = Object.freeze({ catalog: 600, orgConfig: 300, effectiveContext: 90, dataScope: 90, visualState: 300, featureState: 120 });
function getAuthorizationCacheTtlSeconds(kind) {
  if (!Object.prototype.hasOwnProperty.call(AUTHORIZATION_CACHE_TTLS_SECONDS, kind)) throw Object.assign(new Error("authorization_cache_kind_unknown"), { code: "authorization_cache_kind_unknown" });
  return AUTHORIZATION_CACHE_TTLS_SECONDS[kind];
}
module.exports = { AUTHORIZATION_CACHE_TTLS_SECONDS, getAuthorizationCacheTtlSeconds };
