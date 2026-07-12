"use strict";
function createTaxonomyImpactService({ providers = {} } = {}) {
  return { async impactPreview({ organizationId, dimensionValueId, requestedOperation } = {}) {
    const checks = [];
    for (const [name, provider] of Object.entries(providers)) if (provider?.preview) checks.push({ provider: name, ...(await provider.preview({ organizationId, dimensionValueId, requestedOperation })) });
    if (checks.some(c => c.status === "blocked")) return { status: "blocked", checks };
    if (checks.some(c => c.status === "requires_migration")) return { status: "requires_migration", checks };
    if (checks.some(c => c.status === "unknown") || checks.length === 0) return { status: "unknown", checks };
    return { status: "safe", checks };
  }};
}
module.exports = { createTaxonomyImpactService };
