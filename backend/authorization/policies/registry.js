"use strict";

const { PolicyConfigurationError } = require("./errors");

function createPolicyRegistry() {
  const definitions = new Map();
  let frozen = false;
  function validateDefinition(definition) {
    if (!definition || typeof definition !== "object") throw new PolicyConfigurationError("Policy definition must be an object");
    if (!definition.id || typeof definition.id !== "string") throw new PolicyConfigurationError("Policy definition requires id");
    if (!definition.version || typeof definition.version !== "string") throw new PolicyConfigurationError(`Policy ${definition.id} requires version`);
    if (!Array.isArray(definition.requiredFacts)) throw new PolicyConfigurationError(`Policy ${definition.id} requires requiredFacts[]`);
    if (!Array.isArray(definition.supportedSurfaces) || definition.supportedSurfaces.length === 0) throw new PolicyConfigurationError(`Policy ${definition.id} requires supportedSurfaces[]`);
    if (typeof definition.evaluate !== "function") throw new PolicyConfigurationError(`Policy ${definition.id} requires evaluate()`);
    return Object.freeze({ allowNotApplicable: false, ...definition, requiredFacts: Object.freeze([...definition.requiredFacts]), supportedSurfaces: Object.freeze([...definition.supportedSurfaces]) });
  }
  return {
    registerPolicy(definition) {
      if (frozen) throw new PolicyConfigurationError("Policy registry is frozen");
      const normalized = validateDefinition(definition);
      if (definitions.has(normalized.id)) throw new PolicyConfigurationError(`Duplicate policy id: ${normalized.id}`);
      definitions.set(normalized.id, normalized);
      return normalized;
    },
    getPolicy(id) { return definitions.get(id) || null; },
    hasPolicy(id) { return definitions.has(id); },
    listPolicies() { return Object.freeze([...definitions.values()].sort((a, b) => a.id.localeCompare(b.id))); },
    freezeRegistry() { frozen = true; return this; },
    validateRegistry() { return this.listPolicies(); },
    get frozen() { return frozen; },
  };
}

module.exports = { createPolicyRegistry };
