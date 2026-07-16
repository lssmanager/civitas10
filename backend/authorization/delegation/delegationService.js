"use strict";

const { evaluateRoleDelegation } = require("./evaluateRoleDelegation");
const { assertDelegationPair, assertLogtoId } = require("./delegationValidation");

function createDelegationService({ repository, auditPort, policyInvalidationPort } = {}) {
  if (!repository) throw new Error("repository is required");
  const audit = async (event) => auditPort?.record ? auditPort.record(event) : undefined;
  const invalidate = async (event) => {
    if (!policyInvalidationPort?.incrementPolicyVersion || !policyInvalidationPort?.enqueueInvalidation) {
      throw new Error("policy invalidation port from #101 is required for delegation mutations");
    }
    const policyVersion = await policyInvalidationPort.incrementPolicyVersion(event);
    await policyInvalidationPort.enqueueInvalidation({ ...event, policyVersion });
    return policyVersion;
  };
  return {
    evaluate: (input) => evaluateRoleDelegation({ repository, ...input }),
    async upsertBaselineRule({ actorLogtoUserId, reason, ...rule }) {
      assertDelegationPair(rule);
      const saved = await repository.upsertBaselineRule({ ...rule, updatedByLogtoUserId: actorLogtoUserId, reason });
      const policyVersion = await invalidate({ action: "authz.delegation_rule.updated", targetType: "role_delegation_rule", targetId: `${rule.grantorLogtoRoleId}->${rule.targetLogtoRoleId}` });
      await audit({ action: "authz.delegation_rule.updated", actorLogtoUserId, actorType: "owner", targetType: "role_delegation_rule", targetId: `${rule.grantorLogtoRoleId}->${rule.targetLogtoRoleId}`, after: saved, reason, policyVersion });
      return saved;
    },
    async upsertOrganizationRestriction({ actorLogtoUserId, logtoOrganizationId, reason, ...rule }) {
      assertLogtoId(logtoOrganizationId, "logto_organization_id");
      assertDelegationPair(rule);
      if (rule.assignEnabled || rule.revokeEnabled) throw new Error("tenant restrictions may only disable baseline delegation");
      const saved = await repository.upsertRestriction({ ...rule, logtoOrganizationId, updatedByLogtoUserId: actorLogtoUserId, reason });
      const policyVersion = await invalidate({ action: "authz.org_delegation_restriction.updated", logtoOrganizationId, targetType: "org_delegation_restriction", targetId: `${logtoOrganizationId}:${rule.grantorLogtoRoleId}->${rule.targetLogtoRoleId}` });
      await audit({ action: "authz.org_delegation_restriction.updated", actorLogtoUserId, actorType: "organization", logtoOrganizationId, targetType: "org_delegation_restriction", targetId: `${logtoOrganizationId}:${rule.grantorLogtoRoleId}->${rule.targetLogtoRoleId}`, after: saved, reason, policyVersion });
      return saved;
    },
  };
}

module.exports = { createDelegationService };
