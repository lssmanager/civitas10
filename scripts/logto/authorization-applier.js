'use strict'
const { LogtoBootstrapPlanError } = require('./errors')
const { fingerprintRemoteState } = require('./drift-report')
const { canonicalJson, hashContract } = require('./canonical-contract-loader')
const { applyResourceOperation } = require('./bootstrap-api-resource')
const { applyPermissionOperation } = require('./bootstrap-permissions')
const { applyGlobalRoleOperation } = require('./bootstrap-global-roles')
const { applyOrganizationRoleOperation } = require('./bootstrap-organization-roles')
function assertApplyApproval({ requireExplicitApproval, approved, expectedPlanHash, actor, reason, idempotencyKey, preflightOk }) {
  if (requireExplicitApproval && !approved) throw new LogtoBootstrapPlanError('apply requires explicit approval and must not run implicitly', { mode: 'apply-rbac' })
  if (preflightOk !== true) throw new LogtoBootstrapPlanError('apply requires successful preflight', { preflightOk })
  if (!actor) throw new LogtoBootstrapPlanError('apply requires audit actor', { field: 'actor' })
  if (!reason) throw new LogtoBootstrapPlanError('apply requires audit reason', { field: 'reason' })
  if (!expectedPlanHash) throw new LogtoBootstrapPlanError('apply requires expected plan hash', { field: 'expectedPlanHash' })
  if (!idempotencyKey) throw new LogtoBootstrapPlanError('apply requires idempotency key', { field: 'idempotencyKey' })
}
function hashPlan(plan) { return require('crypto').createHash('sha256').update(canonicalJson({ ...plan, generatedAt: undefined, planHash: undefined })).digest('hex') }
async function applyAuthorizationPlan({ plan, contract, remoteState, client, requireExplicitApproval = true, approved = false, expectedPlanHash, actor, reason, idempotencyKey, preflightOk = false, logger = console }) {
  assertApplyApproval({ requireExplicitApproval, approved, expectedPlanHash, actor, reason, idempotencyKey, preflightOk })
  if (expectedPlanHash !== plan.planHash) throw new LogtoBootstrapPlanError('apply refused: expected plan hash does not match plan', { expectedPlanHash, planHash: plan.planHash })
  if (plan.contractHash !== (contract.contractHash || hashContract(contract.manifest))) throw new LogtoBootstrapPlanError('stale plan: contract hash changed', { planHash: plan.contractHash, currentHash: contract.contractHash })
  const currentPlanHash = hashPlan(plan)
  if (currentPlanHash !== plan.planHash) throw new LogtoBootstrapPlanError('stale plan: plan hash does not match plan contents', { planHash: plan.planHash, currentPlanHash })
  const currentFingerprint = fingerprintRemoteState(remoteState)
  if (plan.remoteFingerprint !== currentFingerprint) throw new LogtoBootstrapPlanError('stale plan: remote fingerprint changed', { planFingerprint: plan.remoteFingerprint, currentFingerprint })
  if (plan.destructiveOperations?.length) throw new LogtoBootstrapPlanError('normal apply refuses destructive operations', { destructiveOperations: plan.destructiveOperations })
  const results = []
  const context = { remoteResourceId: plan.resource.remoteId, createdResourceId: null, actor, reason, idempotencyKey }
  for (const operation of allMutatingOperations(plan)) {
    const result = { operationId: operation.operationId, phase: operation.type, targetType: operation.targetType, targetId: operation.targetId, desiredFingerprint: operation.operationId, status: 'running', attempt: 1, actor, reason, idempotencyKey, startedAt: new Date(0).toISOString() }
    try { const response = await dispatch(client, operation, context); if (operation.type === 'create-resource') context.createdResourceId = response?.id || operation.targetId; result.status = 'applied'; result.completedAt = new Date(0).toISOString(); results.push(result) } catch (error) { result.status = 'failed'; result.errorCode = error.code || error.name; result.retryable = Boolean(error.retryable); result.completedAt = new Date(0).toISOString(); results.push(result); logger.error?.('logto apply operation failed', { operationId: operation.operationId, errorCode: result.errorCode }); break }
  }
  if (results.length === 0) results.push({ operationId: 'noop', phase: 'apply', targetType: 'plan', targetId: plan.planHash, desiredFingerprint: plan.planHash, status: 'noop', attempt: 0, actor, reason, idempotencyKey })
  return { schemaVersion: '2026-07-logto-authz-apply-result-v1', contractHash: plan.contractHash, planHash: plan.planHash, actor, reason, idempotencyKey, rollbackReport: { mode: 'forward-only-idempotent', appliedOperationIds: results.filter((r)=>r.status === 'applied').map((r)=>r.operationId) }, results }
}
function allMutatingOperations(plan) { return [...plan.resource.operations.filter((op)=>op.type.startsWith('create')), ...plan.permissions.create, ...plan.permissions.update, ...plan.globalRoles.create, ...plan.organizationRoles.create, ...plan.globalRoles.updateAssignments, ...plan.organizationRoles.updateAssignments] }
async function dispatch(client, operation, context) { if (operation.targetType === 'resource') return applyResourceOperation(client, operation, context); if (operation.targetType === 'permission') return applyPermissionOperation(client, operation, context); if (operation.targetType === 'global-role') return applyGlobalRoleOperation(client, operation, context); if (operation.targetType === 'organization-role') return applyOrganizationRoleOperation(client, operation, context); return null }
module.exports = { allMutatingOperations, applyAuthorizationPlan, assertApplyApproval, hashPlan }
