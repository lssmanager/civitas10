"use strict";

const MANAGEMENT_LEVEL_CATALOG_VERSION = "2026-07-civitas10-management-levels-v1";
const MANAGEMENT_LEVELS = Object.freeze(["organization", "strategic", "tactical", "coordination", "operational", "administrative"]);
const MANAGEMENT_LEVEL_ORDER = Object.freeze({ organization: 0, strategic: 1, tactical: 2, coordination: 3, operational: 4, administrative: 5 });
function isManagementLevel(value) { return Object.prototype.hasOwnProperty.call(MANAGEMENT_LEVEL_ORDER, value); }
function managementLevelOrder(value) { return MANAGEMENT_LEVEL_ORDER[value]; }
module.exports = { MANAGEMENT_LEVEL_CATALOG_VERSION, MANAGEMENT_LEVELS, MANAGEMENT_LEVEL_ORDER, isManagementLevel, managementLevelOrder };
