'use strict'
const { canonicalJson } = require('./canonical-contract-loader')
const crypto = require('crypto')
function fingerprintRemoteState(remote) { return crypto.createHash('sha256').update(canonicalJson({ resource: remote.resource, permissions: remote.permissions, globalRoles: remote.globalRoles, organizationRoles: remote.organizationRoles })).digest('hex') }
function emptyBucket() { return { create: [], update: [], updateAssignments: [], noop: [], conflicts: [], unmanaged: [] } }
function summarizePlan(plan) { return { resource: plan.resource.operations.length, permissionCreates: plan.permissions.create.length, permissionUpdates: plan.permissions.update.length, permissionConflicts: plan.permissions.conflicts.length, globalRoleCreates: plan.globalRoles.create.length, organizationRoleCreates: plan.organizationRoles.create.length, drift: { missing: plan.drift?.missing?.length || 0, extra: plan.drift?.extra?.length || 0, legacy: plan.drift?.legacy?.length || 0, wrongSurface: plan.drift?.wrongSurface?.length || 0, plannedLeakage: plan.drift?.plannedLeakage?.length || 0, wrongResourceIndicator: plan.drift?.wrongResourceIndicator?.length || 0 }, destructive: plan.destructiveOperations.length, warnings: plan.warnings.length } }
module.exports = { emptyBucket, fingerprintRemoteState, summarizePlan }
