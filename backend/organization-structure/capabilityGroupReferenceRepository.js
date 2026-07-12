"use strict";
function validateCapabilityGroupRef(row){ const blob=JSON.stringify(row).toLowerCase(); if(/(access[_-]?token|refresh[_-]?token|password|secret|jwt|token)/.test(blob)) throw Object.assign(new Error("organization_capability_group_sync_failed"),{code:"organization_capability_group_sync_failed"}); return row; }
module.exports={ validateCapabilityGroupRef };
