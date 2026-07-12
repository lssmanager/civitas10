"use strict";
const { KNOWN_DIMENSIONS, validateDimensionKey, validateStableKey, validateMetadata, validateExternalRef, taxonomyError } = require("./taxonomyValidation");
const { TAXONOMY_REASON_CODES } = require("./taxonomyReasonCodes");
const { assertCanUseForDataScope, assertStableKeyMutable, classifyValueChange } = require("./taxonomyLifecycle");
const { assertParentAllowed } = require("./taxonomyHierarchy");
function requireRuntimePort(port) { if (!port?.incrementPolicyVersion || !port?.enqueueOutbox || !port?.audit) throw taxonomyError(TAXONOMY_REASON_CODES.PROVIDER_UNAVAILABLE); }
function createTaxonomyService({ repository, runtimeConsistencyPort, impactService } = {}) {
  if (!repository) throw new Error("repository_required");
  async function ensureDefinitions() { for (const [dimensionKey, def] of Object.entries(KNOWN_DIMENSIONS)) await repository.upsertDefinition({ id: dimensionKey, dimensionKey, ...def, contractVersion: "2026-07-taxonomy-v1" }); }
  async function bump({ organizationId, actorLogtoUserId, eventType, changeClass, payload = {} }) {
    let state = await repository.getState(organizationId); state = { ...state, taxonomyCatalogVersion: Number(state.taxonomyCatalogVersion || 0) + 1, updatedAt: new Date().toISOString() };
    let policyVersion = payload.policyVersion || null;
    if (changeClass === "authorization-affecting") { requireRuntimePort(runtimeConsistencyPort); policyVersion = await runtimeConsistencyPort.incrementPolicyVersion({ organizationId, actorLogtoUserId, eventType }); }
    await repository.saveState(state);
    const event = { eventType, organizationId, taxonomyCatalogVersion: state.taxonomyCatalogVersion, policyVersion, changeClass, ...payload };
    if (changeClass !== "presentation-only") {
      if (runtimeConsistencyPort?.enqueueOutbox) await runtimeConsistencyPort.enqueueOutbox(event); else await repository.recordOutbox(event);
    }
    if (runtimeConsistencyPort?.audit) await runtimeConsistencyPort.audit(event); else await repository.audit({ action: eventType, ...event });
    return { state, policyVersion };
  }
  return {
    ensureDefinitions,
    async createValue({ organizationId, dimensionKey, stableKey, displayName, actorLogtoUserId, parentValueId = null, metadata = {}, externalRef = null, expectedTaxonomyCatalogVersion } = {}) {
      validateDimensionKey(dimensionKey); validateStableKey(stableKey); validateMetadata(metadata); validateExternalRef(externalRef);
      await ensureDefinitions(); const definition = await repository.getDefinitionByKey(dimensionKey); if (!definition?.isActive) throw taxonomyError(TAXONOMY_REASON_CODES.DIMENSION_DISABLED);
      const state = await repository.getState(organizationId); if (expectedTaxonomyCatalogVersion != null && Number(expectedTaxonomyCatalogVersion) !== Number(state.taxonomyCatalogVersion)) throw taxonomyError(TAXONOMY_REASON_CODES.CATALOG_VERSION_CONFLICT);
      const existing = await repository.findValueByStableKey({ organizationId, dimensionDefinitionId: definition.id, stableKey }); if (existing) return existing;
      let parent = null; if (parentValueId) parent = await repository.getValueById(parentValueId);
      const child = { id: `pending_${Date.now()}`, logtoOrganizationId: organizationId, dimensionDefinitionId: definition.id };
      const parentAncestors = parent ? await repository.ancestorsOf(parent.id) : [];
      assertParentAllowed({ definition, child, parent, ancestorLoader: () => parentAncestors });
      const value = await repository.insertValue({ logtoOrganizationId: organizationId, dimensionDefinitionId: definition.id, dimensionKeyCache: dimensionKey, stableKey, displayName, parentValueId, externalRef, metadata, createdByLogtoUserId: actorLogtoUserId, updatedByLogtoUserId: actorLogtoUserId, status: "draft" });
      await bump({ organizationId, actorLogtoUserId, eventType: "taxonomy.value.created", changeClass: "taxonomy-semantic", payload: { dimensionKey, valueId: value.id } });
      return value;
    },
    async updateValue({ organizationId, dimensionKey, valueId, patch = {}, actorLogtoUserId } = {}) {
      const value = await repository.getValueById(valueId); if (!value) throw taxonomyError(TAXONOMY_REASON_CODES.VALUE_NOT_FOUND);
      if (value.logtoOrganizationId !== organizationId) throw taxonomyError(TAXONOMY_REASON_CODES.VALUE_WRONG_ORGANIZATION);
      if (value.dimensionKeyCache !== dimensionKey) throw taxonomyError(TAXONOMY_REASON_CODES.VALUE_WRONG_DIMENSION);
      if (patch.stableKey) { validateStableKey(patch.stableKey); assertStableKeyMutable(value, patch.stableKey); }
      if (patch.metadata) validateMetadata(patch.metadata); if (patch.externalRef) validateExternalRef(patch.externalRef);
      const next = { ...value, ...patch, updatedByLogtoUserId: actorLogtoUserId };
      const saved = await repository.updateValue(valueId, next); const changeClass = classifyValueChange(value, saved);
      await bump({ organizationId, actorLogtoUserId, eventType: changeClass === "presentation-only" ? "taxonomy.value.renamed" : "taxonomy.value.updated", changeClass, payload: { dimensionKey, valueId } });
      return saved;
    },
    async resolvePublishedDimensionValue({ organizationId, dimensionKey, valueId, capability } = {}) {
      validateDimensionKey(dimensionKey); const definition = await repository.getDefinitionByKey(dimensionKey); const value = await repository.getValueById(valueId);
      if (!value) return { status: "not_found", reasonCode: TAXONOMY_REASON_CODES.VALUE_NOT_FOUND };
      if (value.logtoOrganizationId !== organizationId) return { status: "wrong_organization", reasonCode: TAXONOMY_REASON_CODES.VALUE_WRONG_ORGANIZATION };
      if (value.dimensionKeyCache !== dimensionKey) return { status: "wrong_dimension", reasonCode: TAXONOMY_REASON_CODES.VALUE_WRONG_DIMENSION };
      if (capability && !KNOWN_DIMENSIONS[dimensionKey].capabilities.includes(capability)) return { status: "capability_not_supported", reasonCode: "taxonomy_capability_not_supported" };
      try { assertCanUseForDataScope(value); } catch (err) { return { status: value.status, reasonCode: err.code }; }
      return { status: "active", value, definition };
    },
    async deprecateValue({ organizationId, dimensionKey, valueId, actorLogtoUserId, deprecatedUntil } = {}) {
      const value = await repository.getValueById(valueId); if (!value || value.logtoOrganizationId !== organizationId || value.dimensionKeyCache !== dimensionKey) throw taxonomyError(TAXONOMY_REASON_CODES.VALUE_NOT_FOUND);
      const saved = await repository.updateValue(valueId, { status: "deprecating", deprecatedAt: new Date().toISOString(), deprecatedUntil, updatedByLogtoUserId: actorLogtoUserId });
      await bump({ organizationId, actorLogtoUserId, eventType: "taxonomy.value.deprecating", changeClass: "authorization-affecting", payload: { dimensionKey, valueId } }); return saved;
    },
    async archiveValue({ organizationId, dimensionKey, valueId, actorLogtoUserId } = {}) {
      const impact = impactService ? await impactService.impactPreview({ organizationId, dimensionValueId: valueId, requestedOperation: "archive" }) : { status: "unknown" };
      if (impact.status === "unknown") throw taxonomyError(TAXONOMY_REASON_CODES.IMPACT_UNKNOWN);
      if (impact.status === "requires_migration") throw taxonomyError(TAXONOMY_REASON_CODES.ARCHIVE_REQUIRES_MIGRATION);
      if (impact.status === "blocked") throw taxonomyError(TAXONOMY_REASON_CODES.ARCHIVE_BLOCKED);
      const value = await repository.getValueById(valueId); if (!value || value.logtoOrganizationId !== organizationId || value.dimensionKeyCache !== dimensionKey) throw taxonomyError(TAXONOMY_REASON_CODES.VALUE_NOT_FOUND);
      const saved = await repository.updateValue(valueId, { status: "archived", archivedAt: new Date().toISOString(), archivedByLogtoUserId: actorLogtoUserId, updatedByLogtoUserId: actorLogtoUserId });
      await bump({ organizationId, actorLogtoUserId, eventType: "taxonomy.value.archived", changeClass: "authorization-affecting", payload: { dimensionKey, valueId } }); return saved;
    },
  };
}
module.exports = { createTaxonomyService };
