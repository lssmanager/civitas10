"use strict";
function asBigInt(value, fallback = 0n) {
  if (value === undefined || value === null || value === "") return fallback;
  return typeof value === "bigint" ? value : BigInt(String(value));
}
function serializeVersionSnapshot(row) {
  if (!row) return null;
  return { organizationId: row.logtoOrganizationId || row.logto_organization_id, policyVersion: String(row.version), catalogVersion: String(row.catalogVersion || row.catalog_version || "1"), visualVersion: String(row.visualVersion || row.visual_version || "1") };
}
function createInMemoryAuthorizationRuntimeRepository() {
  const versions = new Map(); const outbox = new Map(); const audits = [];
  function ensureVersion(organizationId) {
    if (!versions.has(organizationId)) versions.set(organizationId, { logtoOrganizationId: organizationId, version: 1n, catalogVersion: "1", visualVersion: 1n, reason: "provisioned" });
    return versions.get(organizationId);
  }
  return {
    versions, outbox, audits,
    async transaction(fn) {
      const v = new Map([...versions.entries()].map(([k, value]) => [k, { ...value }]));
      const o = new Map([...outbox.entries()].map(([k, value]) => [k, { ...value }]));
      const a = audits.slice();
      try { return await fn(this); } catch (error) { versions.clear(); for (const e of v) versions.set(...e); outbox.clear(); for (const e of o) outbox.set(...e); audits.splice(0, audits.length, ...a); throw error; }
    },
    async getVersion(organizationId) { return serializeVersionSnapshot(ensureVersion(organizationId)); },
    async incrementAuthorizationVersion({ organizationId, bumpCatalog = false, bumpVisual = false, reason = "authorization_runtime_mutation", actorUserId = null } = {}) {
      const row = ensureVersion(organizationId); row.version += 1n; if (bumpCatalog) row.catalogVersion = String(asBigInt(row.catalogVersion, 1n) + 1n); if (bumpVisual) row.visualVersion += 1n; row.reason = reason; row.updatedByLogtoUserId = actorUserId; row.updatedAt = new Date().toISOString(); return serializeVersionSnapshot(row);
    },
    async insertOutboxEvent(event) {
      const key = [event.eventType, event.aggregateType, event.aggregateId, event.eventVersion].join("::");
      if (outbox.has(key)) return { ...outbox.get(key), duplicate: true };
      const saved = { id: event.id || `evt_${outbox.size + 1}`, status: "pending", attempts: 0, availableAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...event };
      outbox.set(key, saved); return { ...saved };
    },
    async listOutboxEvents() { return [...outbox.values()].map((e) => ({ ...e })); },
    async saveOutboxEvent(event) { const key = [event.eventType, event.aggregateType, event.aggregateId, event.eventVersion].join("::"); outbox.set(key, { ...event }); return { ...event }; },
    async audit(event) { audits.push({ ...event }); return event; },
  };
}
function createAuthorizationVersionService({ repository }) {
  return { getVersion: (organizationId) => repository.getVersion(organizationId), increment: (input) => repository.incrementAuthorizationVersion(input), serializeVersionSnapshot };
}
module.exports = { asBigInt, serializeVersionSnapshot, createAuthorizationVersionService, createInMemoryAuthorizationRuntimeRepository };
