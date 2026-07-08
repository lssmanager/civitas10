function safeArray(value) { return Array.isArray(value) ? value : []; }
function latestByUpdatedAt(rows = []) { return [...rows].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))[0] || null; }

function buildBootstrapStatus({ logtoOrganization = {}, operations = [], idempotencyKey = null } = {}) {
  const orgId = logtoOrganization.id || logtoOrganization.organizationId || logtoOrganization.logtoOrganizationId || null;
  const candidates = safeArray(operations).filter((operation) => operation.operationType === "organization.bootstrap" && ((orgId && operation.logtoOrganizationId === orgId) || (idempotencyKey && operation.idempotencyKey === idempotencyKey)));
  const operation = latestByUpdatedAt(candidates);
  const base = { canonicalSource: "logto", logtoOrganizationId: orgId, operationId: operation?.id || null, idempotencyKey: operation?.idempotencyKey || idempotencyKey || null, status: operation?.status || "not_started", blockers: [], nextActions: [] };
  if (!operation) return base;
  if (operation.status === "completed") return { ...base, status: "reconciled", message: "Organización creada en Logto y bootstrap completado." };
  if (operation.status === "failed") {
    const organizationCreated = Boolean(operation.logtoOrganizationId || operation.entityId || operation.outputJson?.organizationId);
    return {
      ...base,
      status: organizationCreated ? "bootstrap_incomplete" : "bootstrap_failed",
      lastError: operation.lastErrorJson || operation.outputJson?.lastError || null,
      blockers: [{ code: organizationCreated ? "bootstrap_incomplete" : "bootstrap_failed", severity: organizationCreated ? "warning" : "critical", message: organizationCreated ? "La organización existe en Logto, pero faltan pasos de bootstrap administrativo." : "No se pudo completar el bootstrap de organización.", scope: "organization", logtoOrganizationId: orgId }],
      nextActions: [
        { type: organizationCreated ? "resume_bootstrap" : "retry_failed_step", label: organizationCreated ? "Reanudar bootstrap" : "Reintentar paso fallido", target: { idempotencyKey: operation.idempotencyKey, operationId: operation.id } },
        ...(orgId ? [{ type: "open_logto_resource", label: "Abrir organización en Logto", target: { logtoOrganizationId: orgId } }] : []),
        { type: "mark_reconciled", label: "Marcar como reconciliado tras verificación", target: { operationId: operation.id } },
      ],
    };
  }
  return { ...base, status: "bootstrap_pending", blockers: [{ code: "bootstrap_pending", severity: "info", message: "El bootstrap de organización está en progreso o pendiente de reconciliación.", scope: "organization", logtoOrganizationId: orgId }], nextActions: [{ type: "resume_bootstrap", label: "Reanudar bootstrap", target: { idempotencyKey: operation.idempotencyKey, operationId: operation.id } }] };
}

module.exports = { buildBootstrapStatus };
