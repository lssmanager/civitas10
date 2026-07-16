"use strict";
module.exports = {
  ...require("./membershipProvider"),
  ...require("./resourceOwnershipProvider"),
  ...require("./delegationProvider"),
  ...require("./entitlementProvider"),
  ...require("./dataScopeProvider"),
  ...require("./featureFlagProvider"),
  ...require("./connectorProvider"),
  ...require("./seatProvider"),
  ...require("./auditReadinessProvider"),
};
