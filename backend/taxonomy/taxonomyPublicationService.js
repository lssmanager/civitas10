"use strict";
const { taxonomyError } = require("./taxonomyValidation");
const { TAXONOMY_REASON_CODES } = require("./taxonomyReasonCodes");
function createTaxonomyPublicationService({ repository, runtimeConsistencyPort } = {}) {
  if (!repository) throw new Error("repository_required");
  return { async publish({ organizationId, actorLogtoUserId, expectedTaxonomyCatalogVersion } = {}) {
    return repository.transaction(async () => {
      const state = await repository.getState(organizationId);
      if (expectedTaxonomyCatalogVersion != null && Number(expectedTaxonomyCatalogVersion) !== Number(state.taxonomyCatalogVersion)) throw taxonomyError(TAXONOMY_REASON_CODES.CATALOG_VERSION_CONFLICT);
      const drafts = await repository.listValues({ organizationId, status: "draft" });
      if (drafts.some(v => !v.stableKey || !v.displayName || !v.dimensionDefinitionId)) throw taxonomyError(TAXONOMY_REASON_CODES.PUBLISH_VALIDATION_FAILED);
      const nextVersion = Number(state.taxonomyCatalogVersion || 0) + 1;
      let policyVersion = null;
      if (drafts.length && runtimeConsistencyPort?.incrementPolicyVersion) policyVersion = await runtimeConsistencyPort.incrementPolicyVersion({ organizationId, actorLogtoUserId, eventType: "taxonomy.catalog.published" });
      for (const draft of drafts) await repository.updateValue(draft.id, { status: "active", publishedAt: new Date().toISOString(), publishedByLogtoUserId: actorLogtoUserId, updatedByLogtoUserId: actorLogtoUserId });
      const savedState = await repository.saveState({ ...state, taxonomyCatalogVersion: nextVersion, publishedVersion: nextVersion, status: "published", lastPublishedAt: new Date().toISOString(), lastPublishedByLogtoUserId: actorLogtoUserId });
      const event = { eventType: "taxonomy.catalog.published", organizationId, taxonomyCatalogVersion: nextVersion, policyVersion, changeClass: drafts.length ? "authorization-affecting" : "taxonomy-semantic" };
      if (runtimeConsistencyPort?.enqueueOutbox) await runtimeConsistencyPort.enqueueOutbox(event); else await repository.recordOutbox(event);
      if (runtimeConsistencyPort?.audit) await runtimeConsistencyPort.audit(event); else await repository.audit({ action: "taxonomy.catalog.published", ...event });
      return { taxonomyCatalogVersion: nextVersion, publishedVersion: nextVersion, policyVersion, publishedCount: drafts.length, state: savedState };
    });
  }};
}
module.exports = { createTaxonomyPublicationService };
