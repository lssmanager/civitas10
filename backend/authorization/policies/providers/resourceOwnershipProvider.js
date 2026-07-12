"use strict";
function createStaticResourceOwnershipProvider() {
  return {
    async loadResourceOwnership({ organizationId, resource }) {
      if (!resource?.id || !resource?.type) return { status: "not_found" };
      if (!resource.organizationId) return { status: "unavailable" };
      return { status: resource.organizationId === organizationId ? "belongs" : "cross_tenant", organizationId: resource.organizationId };
    },
  };
}
module.exports = { createStaticResourceOwnershipProvider };
