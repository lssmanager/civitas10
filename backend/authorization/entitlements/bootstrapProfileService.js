"use strict";

function bootstrapError(code) { return Object.assign(new Error(code), { code }); }

function validateBootstrapProfile(profile = {}) {
  if (!profile.profileId || !profile.version || !profile.catalogVersion) throw bootstrapError("bootstrap_profile_invalid");
  if (!Array.isArray(profile.ownerCeilings) || !Array.isArray(profile.tenantActivations) || !Array.isArray(profile.scopeTemplates)) throw bootstrapError("bootstrap_profile_invalid");
  if (profile.lifecycle && profile.lifecycle !== "published") throw bootstrapError("bootstrap_profile_not_published");
  return profile;
}

async function validateProfileReferences({ profile, initialRoleId, permissionCatalog, templateRegistry }) {
  for (const change of [...profile.ownerCeilings, ...profile.tenantActivations]) {
    const permission = change.permission || change.permissionKey;
    const definition = permissionCatalog?.permissionsByName?.[permission] || permissionCatalog?.get?.(permission);
    if (permissionCatalog && (!definition || definition.status !== "active")) throw bootstrapError("bootstrap_profile_permission_unavailable");
    if (change.logtoRoleId && change.logtoRoleId !== initialRoleId) throw bootstrapError("bootstrap_profile_role_mismatch");
  }
  for (const scope of profile.scopeTemplates) {
    const template = templateRegistry?.getTemplate({ scopeTemplateId: scope.scopeTemplateId, scopeTemplateVersion: scope.scopeTemplateVersion });
    if (templateRegistry && (!template || template.lifecycle !== "published")) throw bootstrapError("bootstrap_profile_template_unavailable");
  }
}

function createBootstrapProfileService({ entitlementService, dataScopeService, membershipPort, runtimeConsistencyPort, transactionPort, permissionCatalog, templateRegistry } = {}) {
  if (!entitlementService || !membershipPort || !runtimeConsistencyPort?.audit) throw bootstrapError("bootstrap_profile_dependencies_required");
  const inTransaction = async (fn) => transactionPort?.transaction ? transactionPort.transaction(fn) : fn();
  return {
    async applyProfile({ organizationId, profile, actorLogtoUserId, source = "wizard", initialUserId, initialRoleId, membershipId } = {}) {
      validateBootstrapProfile(profile);
      await validateProfileReferences({ profile, initialRoleId, permissionCatalog, templateRegistry });
      return inTransaction(async () => {
        const membership = await membershipPort.ensureMembershipRoleBinding({ organizationId, userId: initialUserId, canonicalRoleId: initialRoleId, membershipId, source });
        const owner = await entitlementService.upsertOwnerLimits({ organizationId, expectedPolicyVersion: profile.expectedPolicyVersion, actorLogtoUserId, reason: `bootstrap_profile:${profile.profileId}:${profile.version}`, changes: profile.ownerCeilings.map((change) => ({ ...change, logtoRoleId: initialRoleId })) });
        const tenant = await entitlementService.upsertTenantActivations({ organizationId, expectedPolicyVersion: owner.policyVersion, actorLogtoUserId, reason: `bootstrap_profile:${profile.profileId}:${profile.version}`, changes: profile.tenantActivations.map((change) => ({ ...change, logtoRoleId: initialRoleId })) });
        const scopes = [];
        for (const template of profile.scopeTemplates) {
          if (!dataScopeService) continue;
          scopes.push(await dataScopeService.createAssignment({ ...template, organizationId, userId: initialUserId, logtoRoleId: initialRoleId, canonicalRoleId: initialRoleId, membershipId: membership.membershipId, actorLogtoUserId, sourceType: "bootstrap_profile", sourceRef: profile.profileId, sourceVersion: profile.version }));
        }
        await runtimeConsistencyPort.audit({ action: "authorization.bootstrap_profile.applied", organizationId, actorLogtoUserId, profileId: profile.profileId, profileVersion: profile.version, catalogVersion: profile.catalogVersion, source, policyVersion: tenant.policyVersion, membershipId: membership.membershipId, scopeCount: scopes.length });
        return { organizationId, profileId: profile.profileId, profileVersion: profile.version, catalogVersion: profile.catalogVersion, policyVersion: tenant.policyVersion, membership, scopes: scopes.map((item) => item.assignment) };
      });
    },
  };
}

module.exports = { createBootstrapProfileService, validateBootstrapProfile, validateProfileReferences };
