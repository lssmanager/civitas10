"use strict";
function createTokenMembershipProvider(overrides = {}) {
  return {
    async evaluateMembership({ subject, organizationId }) {
      if (typeof overrides.evaluateMembership === "function") return overrides.evaluateMembership({ subject, organizationId });
      if (!subject || !organizationId) return { status: "unknown" };
      return { status: "active", source: "verified_organization_token" };
    },
  };
}
module.exports = { createTokenMembershipProvider };
