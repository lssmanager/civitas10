"use strict";

const crypto = require("node:crypto");
const { authorize } = require("./policies/authorize");
const { POLICY_REASON_CODES } = require("./policies/reasonCodes");

const SENSITIVE_KEY_PATTERN = /(token|secret|password|credential|authorization|cookie|client[_-]?secret|api[_-]?key|redis[_-]?key|payload|email|name)/i;
const SAFE_REF_FIELDS = new Set(["dimensionKey", "dimensionValueId", "unitId", "groupId", "assignmentId", "strategy", "resourceKind", "ownership", "relation", "version", "reasonCode"]);

function hashSubject(subject) {
  if (!subject) return null;
  return `sub_${crypto.createHash("sha256").update(String(subject)).digest("hex").slice(0, 12)}`;
}

function redact(value, depth = 0) {
  if (value == null || depth > 4) return value == null ? value : "[Redacted]";
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => redact(item, depth + 1));
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).filter(([key]) => !SENSITIVE_KEY_PATTERN.test(key)).map(([key, entry]) => [key, SAFE_REF_FIELDS.has(key) ? String(entry) : redact(entry, depth + 1)]));
  }
  if (typeof value === "string" && /bearer\s+|eyJ|refresh_|access_/i.test(value)) return "[Redacted]";
  return value;
}

function tokenDiagnostics(principal = {}, expected = {}) {
  const scopes = [...(principal.scopes instanceof Set ? principal.scopes : new Set(principal.scopes || []))].sort();
  const tokenType = principal.tokenType || (principal.organizationId ? "organization" : "global");
  const audience = Array.isArray(principal.audience) ? principal.audience.map(String) : [];
  return {
    valid: Boolean(principal.subject),
    subject: hashSubject(principal.subject || principal.sub),
    tokenType,
    expectedAudience: expected.audience || null,
    expectedIssuer: expected.issuer || null,
    audienceMatches: expected.audience ? audience.includes(expected.audience) : undefined,
    issuerMatches: expected.issuer ? principal.issuer === expected.issuer : undefined,
    effectiveScopes: scopes,
  };
}

function visualDiagnostics({ screen, action, visualPreference, featureFlag } = {}) {
  return {
    screenId: screen?.screenId || null,
    actionId: action?.actionId || null,
    routeId: screen?.route?.routeId || null,
    visibility: screen?.organizationCustomization?.visibility || null,
    preference: visualPreference ? redact({ hidden: Boolean(visualPreference.hidden), locked: visualPreference.locked, hideable: visualPreference.hideable, responsiveRule: visualPreference.responsiveRule, version: visualPreference.version }) : null,
    featureFlag: featureFlag ? redact({ key: featureFlag.key, enabled: Boolean(featureFlag.enabled), reasonCode: featureFlag.reasonCode, version: featureFlag.version }) : null,
  };
}

function runtimeDiagnostics(runtime = {}) {
  return redact({
    cache: { status: runtime.cacheHit === true ? "hit" : runtime.cacheHit === false ? "miss" : "unknown", kind: runtime.cacheKind, ttlSeconds: runtime.ttlSeconds },
    policyVersion: runtime.policyVersion,
    configVersion: runtime.configVersion,
    visualVersion: runtime.visualVersion,
    readModelVersion: runtime.readModelVersion,
    outboxLagMs: runtime.outboxLagMs,
    invalidationLagMs: runtime.invalidationLagMs,
    staleSnapshotReasonCode: runtime.staleSnapshotReasonCode,
  });
}

function provenanceDiagnostics({ entitlement, dataScope, taxonomy, unit, governance } = {}) {
  return {
    authorizationChain: redact({
      roleMembership: entitlement?.roleMembership || null,
      permission: entitlement?.permission || null,
      ownerCeiling: entitlement?.ownerCeiling || null,
      tenantActivation: entitlement?.tenantActivation || null,
      reasonCodes: entitlement?.reasonCodes || [],
    }),
    scopeChain: redact({
      strategy: dataScope?.strategy || dataScope?.constraint?.kind || null,
      assignmentId: dataScope?.assignmentId || dataScope?.assignmentIds?.[0] || null,
      dimensionKey: taxonomy?.dimensionKey || dataScope?.dimensionKey || null,
      dimensionValueId: taxonomy?.dimensionValueId || dataScope?.dimensionValueId || null,
      unitId: unit?.unitId || dataScope?.unitId || null,
      relation: unit?.relation || dataScope?.relation || null,
      resourceOwnership: dataScope?.resourceOwnership || null,
      reasonCode: dataScope?.reasonCode || null,
    }),
    governance: redact({ readModelVersion: governance?.readModelVersion, policyConfigVersion: governance?.policyConfigVersion }),
  };
}

async function explainAuthorization(input = {}) {
  const decision = input.decision || await authorize(input);
  const requiredPermission = input.permission || decision.permission;
  const token = tokenDiagnostics(input.principal, input.expected);
  const tenantOrg = input.principal?.organizationId || null;
  const routeOrg = input.organizationId || input.routeOrganizationId || null;
  const hasDiagnosticPermission = input.diagnosticPermissionGranted === true;
  const tenantMayDiagnose = hasDiagnosticPermission && input.surface === "organization" && token.tokenType === "organization" && (!routeOrg || tenantOrg === routeOrg);
  const ownerMayDiagnose = hasDiagnosticPermission && input.surface === "owner" && token.tokenType === "global";
  const diagnosticAllowed = ownerMayDiagnose || tenantMayDiagnose;
  if (!diagnosticAllowed) {
    return { allowed: false, diagnosticAllowed: false, reasonCode: POLICY_REASON_CODES.ORGANIZATION_ROUTE_MISMATCH, finalDecision: { allowed: false, reasonCode: POLICY_REASON_CODES.ORGANIZATION_ROUTE_MISMATCH } };
  }
  const scopePresent = token.effectiveScopes.includes(requiredPermission);
  const finalReason = decision.reasonCode || (decision.allowed ? POLICY_REASON_CODES.AUTHORIZATION_ALLOWED : POLICY_REASON_CODES.POLICY_EVALUATION_FAILED);
  return Object.freeze({
    diagnosticAllowed: true,
    decisionId: decision.decisionId,
    kind: input.kind || "route",
    token,
    organizationContext: { tokenOrganizationId: tenantOrg, routeOrganizationId: routeOrg, matches: !routeOrg || !tenantOrg || tenantOrg === routeOrg },
    requiredPermission,
    checks: [
      { step: "token_valid", passed: token.valid, reasonCode: token.valid ? POLICY_REASON_CODES.AUTHORIZATION_ALLOWED : POLICY_REASON_CODES.SURFACE_MISMATCH },
      { step: "scope_present", passed: scopePresent, reasonCode: scopePresent ? POLICY_REASON_CODES.AUTHORIZATION_ALLOWED : POLICY_REASON_CODES.PERMISSION_MISSING },
      { step: "organization_role_path", passed: (decision.evaluatedRolePaths || []).length > 0 || input.surface === "owner", reasonCode: (decision.evaluatedRolePaths || []).length > 0 || input.surface === "owner" ? POLICY_REASON_CODES.AUTHORIZATION_ALLOWED : POLICY_REASON_CODES.ROLE_PATH_MISSING },
      { step: "policy_result", passed: Boolean(decision.allowed), reasonCode: finalReason },
    ],
    provenance: provenanceDiagnostics(input.provenance || {}),
    visual: visualDiagnostics(input.visual || {}),
    runtime: runtimeDiagnostics(input.runtime || {}),
    finalDecision: { allowed: Boolean(decision.allowed), reasonCode: finalReason, policyVersion: decision.policyVersion, matchedRolePathId: decision.matchedRolePathId },
  });
}

module.exports = { explainAuthorization, hashSubject, redact, tokenDiagnostics, runtimeDiagnostics, provenanceDiagnostics };
