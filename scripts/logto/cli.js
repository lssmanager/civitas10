#!/usr/bin/env node
'use strict'
const fs = require('fs')
const path = require('path')
const { loadLogtoBootstrapConfig } = require('./config')
const { loadCanonicalAuthorizationContract } = require('./canonical-contract-loader')
const { assertValidLocalAuthorizationContract } = require('./authorization-validator')
const { emptyRemoteState, readAuthorizationState } = require('./authorization-state-reader')
const { buildAuthorizationPlan } = require('./authorization-planner')
const { applyAuthorizationPlan } = require('./authorization-applier')
const { buildCustomClaimsPlan } = require('./bootstrap-custom-token-claims')
const { createLogtoManagementApiClient } = require('./management-api-client')
const { redact } = require('./redaction')
async function main(argv = process.argv.slice(2), env = process.env) {
  const mode = argv[0] || 'check-rbac'
  const contract = loadCanonicalAuthorizationContract()
  assertValidLocalAuthorizationContract(contract)
  if (mode === 'contract-check') return print({ mode, ok: true, contractHash: contract.contractHash, contractVersion: contract.manifest.contractVersion })
  if (mode.includes('custom-claims')) return handleCustomClaims(mode)
  const requiresRemote = ['plan-rbac','apply-rbac','check-rbac'].includes(mode) && Boolean(env.LOGTO_M2M_APP_ID && env.LOGTO_M2M_APP_SECRET)
  const config = loadLogtoBootstrapConfig(env, { requireCredentials: mode === 'apply-rbac' })
  const client = config.hasCredentials ? createLogtoManagementApiClient(config) : null
  const remoteState = client ? await readAuthorizationState(client, { resourceIndicator: contract.manifest.resource }) : emptyRemoteState({ source: 'empty-no-credentials' })
  const plan = buildAuthorizationPlan({ contract, remoteState, targetEnvironment: config.endpoint })
  if (mode === 'check-rbac') return print({ mode, ok: plan.permissions.conflicts.length === 0, remoteState: remoteState.source, summary: require('./drift-report').summarizePlan(plan), warning: config.hasCredentials ? null : 'No M2M credentials; remote drift check skipped and empty state was used.' })
  if (mode === 'plan-rbac') { const out = argv[1] || path.join(process.cwd(), 'artifacts/logto-authz-plan.json'); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, `${JSON.stringify(redact(plan), null, 2)}\n`); return print({ mode, planPath: out, contractHash: plan.contractHash, planHash: plan.planHash, summary: require('./drift-report').summarizePlan(plan) }) }
  if (mode === 'apply-rbac') { const planPath = argv[1]; if (!planPath) throw new Error('apply-rbac requires a plan path'); const approved = env.LOGTO_BOOTSTRAP_ALLOW_APPLY === 'true'; const approvedPlan = JSON.parse(fs.readFileSync(planPath, 'utf8')); const result = await applyAuthorizationPlan({ plan: approvedPlan, contract, remoteState, client, approved }); return print({ mode, result }) }
  throw new Error(`Unknown logto authz mode: ${mode}`)
}
function handleCustomClaims(mode) { const plan = buildCustomClaimsPlan(); if (mode === 'check-custom-claims') return print({ mode, ok: true, warnings: plan.warnings }); if (mode === 'plan-custom-claims') return print({ mode, plan }); throw new Error('apply-custom-claims is blocked until custom JWT context is verified and explicitly approved') }
function print(value) { console.log(JSON.stringify(redact(value), null, 2)); return value }
if (require.main === module) main().catch((error)=>{ console.error(JSON.stringify(redact({ error: error.message, code: error.code, details: error.details }), null, 2)); process.exit(1) })
module.exports = { main }
