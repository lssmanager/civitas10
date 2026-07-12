'use strict'
const { LogtoBootstrapPlanError } = require('./errors')
const { fingerprintRemoteState } = require('./drift-report')
const { hashContract } = require('./canonical-contract-loader')
const { applyResourceOperation } = require('./bootstrap-api-resource')
const { applyPermissionOperation } = require('./bootstrap-permissions')
const { applyGlobalRoleOperation } = require('./bootstrap-global-roles')
const { applyOrganizationRoleOperation } = require('./bootstrap-organization-roles')
async function applyAuthorizationPlan({ plan, contract, remoteState, client, requireExplicitApproval = true, approved = false, logger = console }) {
  if (requireExplicitApproval && !approved) throw new LogtoBootstrapPlanError('apply requires explicit approval and must not run implicitly', { mode: 'apply-rbac' })
  if (plan.contractHash !== (contract.contractHash || hashContract(contract.manifest))) throw new LogtoBootstrapPlanError('stale plan: contract hash changed', { planHash: plan.contractHash, currentHash: contract.contractHash })
  const currentFingerprint = fingerprintRemoteState(remoteState)
  if (plan.remoteFingerprint !== currentFingerprint) throw new LogtoBootstrapPlanError('stale plan: remote fingerprint changed', { planFingerprint: plan.remoteFingerprint, currentFingerprint })
  if (plan.destructiveOperations?.length) throw new LogtoBootstrapPlanError('normal apply refuses destructive operations', { destructiveOperations: plan.destructiveOperations })
  const results = []
  const context = { remoteResourceId: plan.resource.remoteId, createdResourceId: null }
  for (const operation of allMutatingOperations(plan)) {
    const result = { operationId: operation.operationId, phase: operation.type, targetType: operation.targetType, targetId: operation.targetId, desiredFingerprint: operation.operationId, status: 'running', attempt: 1, startedAt: new Date(0).toISOString() }
    try { const response = await dispatch(client, operation, context); if (operation.type === 'create-resource') context.createdResourceId = response?.id || operation.targetId; result.status = 'applied'; result.completedAt = new Date(0).toISOString(); results.push(result) } catch (error) { result.status = 'failed'; result.errorCode = error.code || error.name; result.retryable = Boolean(error.retryable); result.completedAt = new Date(0).toISOString(); results.push(result); logger.error?.('logto apply operation failed', { operationId: operation.operationId, errorCode: result.errorCode }); break }
  }
  if (results.length === 0) results.push({ operationId: 'noop', phase: 'apply', targetType: 'plan', targetId: plan.planHash, desiredFingerprint: plan.planHash, status: 'noop', attempt: 0 })
  return { schemaVersion: '2026-07-logto-authz-apply-result-v1', contractHash: plan.contractHash, planHash: plan.planHash, results }
}
function allMutatingOperations(plan) { return [...plan.resource.operations.filter((op)=>op.type.startsWith('create')), ...plan.permissions.create, ...plan.permissions.update, ...plan.globalRoles.create, ...plan.organizationRoles.create, ...plan.globalRoles.updateAssignments, ...plan.organizationRoles.updateAssignments] }
async function dispatch(client, operation, context) { if (operation.targetType === 'resource') return applyResourceOperation(client, operation); if (operation.targetType === 'permission') return applyPermissionOperation(client, operation, context); if (operation.targetType === 'global-role') return applyGlobalRoleOperation(client, operation); if (operation.targetType === 'organization-role') return applyOrganizationRoleOperation(client, operation); return null }
module.exports = { allMutatingOperations, applyAuthorizationPlan }
