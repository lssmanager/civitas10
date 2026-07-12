"use strict";
const { TAXONOMY_REASON_CODES } = require("./taxonomyReasonCodes");
const { taxonomyError } = require("./taxonomyValidation");
function assertCanUseForDataScope(value) {
  if (!value) throw taxonomyError(TAXONOMY_REASON_CODES.VALUE_NOT_FOUND);
  if (value.status === "active") return true;
  if (value.status === "draft") throw taxonomyError(TAXONOMY_REASON_CODES.VALUE_NOT_PUBLISHED);
  if (value.status === "deprecating") throw taxonomyError(TAXONOMY_REASON_CODES.VALUE_DEPRECATING);
  if (value.status === "archived") throw taxonomyError(TAXONOMY_REASON_CODES.VALUE_ARCHIVED);
  throw taxonomyError(TAXONOMY_REASON_CODES.VALUE_NOT_FOUND);
}
function classifyValueChange(before = {}, after = {}) {
  if (before.status !== after.status || before.parentValueId !== after.parentValueId) return "authorization-affecting";
  if (before.stableKey !== after.stableKey || before.dimensionDefinitionId !== after.dimensionDefinitionId) return "authorization-affecting";
  if (before.displayName !== after.displayName || before.description !== after.description || before.sortOrder !== after.sortOrder) return "presentation-only";
  return "taxonomy-semantic";
}
function assertStableKeyMutable(value, nextStableKey) { if (value?.status !== "draft" && value?.stableKey !== nextStableKey) throw taxonomyError(TAXONOMY_REASON_CODES.STABLE_KEY_IMMUTABLE); }
module.exports = { assertCanUseForDataScope, classifyValueChange, assertStableKeyMutable };
