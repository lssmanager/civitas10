"use strict";
const { evaluateRoleDelegation } = require("../../delegation");
function createDelegationPolicyProvider({ repository, knownRoleIds } = {}) {
  return {
    async evaluateDelegation(input) {
      return evaluateRoleDelegation({ ...input, repository, knownRoleIds });
    },
  };
}
module.exports = { createDelegationPolicyProvider };
