"use strict";
const CACHE_KEYS=Object.freeze({ dataScope:({orgId,userId,policyVersion})=>`civitas:authz:data-scope:v1:${orgId}:${userId}:${policyVersion}`, effective:({orgId,userId,policyVersion})=>`civitas:authz:effective:v1:${orgId}:${userId}:${policyVersion}` });
module.exports={CACHE_KEYS};
