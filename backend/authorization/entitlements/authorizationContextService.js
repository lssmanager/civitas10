"use strict";
const { evaluateOrganizationEntitlement } = require("./entitlementEvaluator");
async function buildAuthorizationContext({ organizationId, principal, repository, roleIdToName = {}, permissions = [] } = {}) {
  const tokenScopes = principal?.scopes instanceof Set ? principal.scopes : new Set(principal?.scopes || []);
  const rolePaths = (principal?.organizationRoleIds || principal?.organizationRoles || []).map((roleId, index) => ({ rolePathId: `role_path_${index}_${roleId}`, logtoRoleId: roleId, tokenScopePresent: true }));
  const policyVersion = repository?.getPolicyVersion ? await repository.getPolicyVersion(organizationId) : undefined;
  const tokenPermissions = [...tokenScopes].sort();
  const effectivePermissions = [];
  const rolePathsSummary = [];
  for (const permission of permissions.length ? permissions : tokenPermissions) {
    const decision = await evaluateOrganizationEntitlement({ organizationId, subject: principal?.subject, tokenScopes, rolePaths: rolePaths.map((path) => ({ ...path, tokenScopePresent: tokenScopes.has(permission) })), permission, policyVersion, repository, roleIdToName });
    if (decision.allowed) effectivePermissions.push(permission);
    rolePathsSummary.push(...decision.evaluatedRolePaths.map((path) => ({ rolePathId: path.rolePathId, permission, allowed: path.allowed, reasonCode: path.reasonCode })));
  }
  return { organizationId, policyVersion, tokenPermissions, effectivePermissions: [...new Set(effectivePermissions)].sort(), rolePathsSummary };
}
module.exports = { buildAuthorizationContext };
