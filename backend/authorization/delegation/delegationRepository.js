"use strict";

const { assertDelegationPair, assertLogtoId } = require("./delegationValidation");

function createInMemoryDelegationRepository({ baselineRules = [], restrictions = [] } = {}) {
  const state = { baselineRules: [...baselineRules], restrictions: [...restrictions] };
  const key = (rule) => `${rule.grantorLogtoRoleId}->${rule.targetLogtoRoleId}`;
  const orgKey = (rule) => `${rule.logtoOrganizationId}:${key(rule)}`;
  return {
    state,
    async getBaselineRulesForGrantors(grantorRoleIds, targetRoleId) {
      return state.baselineRules.filter((rule) => grantorRoleIds.includes(rule.grantorLogtoRoleId) && (!targetRoleId || rule.targetLogtoRoleId === targetRoleId));
    },
    async getRestrictionsForOrganization(logtoOrganizationId, grantorRoleIds, targetRoleId) {
      return state.restrictions.filter((rule) => rule.logtoOrganizationId === logtoOrganizationId && grantorRoleIds.includes(rule.grantorLogtoRoleId) && (!targetRoleId || rule.targetLogtoRoleId === targetRoleId));
    },
    async upsertBaselineRule(rule) {
      assertDelegationPair(rule);
      const normalized = { isActive: true, canAssign: false, canRevoke: false, ...rule };
      const idx = state.baselineRules.findIndex((existing) => key(existing) === key(normalized));
      if (idx >= 0) state.baselineRules[idx] = { ...state.baselineRules[idx], ...normalized };
      else state.baselineRules.push(normalized);
      return normalized;
    },
    async upsertRestriction(rule) {
      assertLogtoId(rule.logtoOrganizationId, "logto_organization_id");
      assertDelegationPair(rule);
      const normalized = { isActive: true, assignDisabled: false, revokeDisabled: false, ...rule };
      const idx = state.restrictions.findIndex((existing) => orgKey(existing) === orgKey(normalized));
      if (idx >= 0) state.restrictions[idx] = { ...state.restrictions[idx], ...normalized };
      else state.restrictions.push(normalized);
      return normalized;
    },
  };
}

module.exports = { createInMemoryDelegationRepository };
