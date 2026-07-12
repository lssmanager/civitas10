'use strict'
const ALLOWED_CUSTOM_CLAIMS = Object.freeze(['https://civitas.didaxus.com/claims/organization_role_ids', 'https://civitas.didaxus.com/claims/authz_contract_version'])
function validateCustomClaimsPlan(plan = {}) { const claims = plan.claims || []; const forbidden = claims.filter((claim)=>!ALLOWED_CUSTOM_CLAIMS.includes(claim)); return { valid: forbidden.length === 0, forbidden, allowedClaims: ALLOWED_CUSTOM_CLAIMS } }
function buildCustomClaimsPlan() { return { schemaVersion: '2026-07-logto-custom-claims-plan-v1', operations: [], claims: ALLOWED_CUSTOM_CLAIMS, warnings: ['Custom claims apply is separated from RBAC and remains blocked until Logto script context is verified for #88/#90.'] } }
module.exports = { ALLOWED_CUSTOM_CLAIMS, buildCustomClaimsPlan, validateCustomClaimsPlan }
