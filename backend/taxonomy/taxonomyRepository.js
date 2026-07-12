"use strict";
function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
function createInMemoryTaxonomyRepository() {
  const definitions = new Map(); const values = new Map(); const states = new Map(); const outbox = []; const audits = []; const idempotency = new Map();
  return {
    outbox, audits,
    async transaction(fn) { return fn(this); },
    async upsertDefinition(def) { const row = { ...def, id: def.id || def.dimensionKey, isActive: def.isActive !== false }; definitions.set(row.dimensionKey, row); return clone(row); },
    async getDefinitionByKey(key) { return clone(definitions.get(key)); },
    async listDefinitions() { return clone([...definitions.values()]); },
    async getState(org) { return clone(states.get(org) || { logtoOrganizationId: org, taxonomyCatalogVersion: 0, publishedVersion: 0, status: "draft" }); },
    async saveState(state) { states.set(state.logtoOrganizationId, { ...state }); return clone(state); },
    async insertValue(row) { const id = row.id || `value_${values.size + 1}`; const saved = { status: "draft", sortOrder: 0, metadata: {}, ...row, id }; values.set(id, saved); return clone(saved); },
    async updateValue(id, patch) { const saved = { ...values.get(id), ...patch }; values.set(id, saved); return clone(saved); },
    async getValueById(id) { return clone(values.get(id)); },
    async findValueByStableKey({ organizationId, dimensionDefinitionId, stableKey }) { return clone([...values.values()].find(v => v.logtoOrganizationId === organizationId && v.dimensionDefinitionId === dimensionDefinitionId && v.stableKey === stableKey)); },
    async listValues({ organizationId, dimensionKey, status } = {}) { return clone([...values.values()].filter(v => (!organizationId || v.logtoOrganizationId === organizationId) && (!dimensionKey || v.dimensionKeyCache === dimensionKey) && (!status || v.status === status))); },
    async ancestorsOf(id) { const result = []; let current = values.get(id); const seen = new Set(); while (current?.parentValueId && !seen.has(current.parentValueId)) { seen.add(current.parentValueId); current = values.get(current.parentValueId); if (current) result.push(current); } return clone(result); },
    async recordOutbox(event) { outbox.push(clone(event)); return clone(event); },
    async audit(event) { audits.push(clone(event)); return clone(event); },
    async getIdempotency(key) { return clone(idempotency.get(key)); },
    async setIdempotency(key, result) { idempotency.set(key, clone(result)); return result; },
  };
}
module.exports = { createInMemoryTaxonomyRepository };
