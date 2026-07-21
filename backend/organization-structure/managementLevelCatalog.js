"use strict";

const MANAGEMENT_LEVEL_CATALOG_VERSION = "2026-07-civitas10-management-levels-v1";
const VIRTUAL_ORGANIZATION_MANAGEMENT_LEVEL = "organization";
const PERSISTED_MANAGEMENT_LEVELS = Object.freeze(["strategic", "tactical", "coordination", "operational", "administrative"]);
const MANAGEMENT_LEVELS = Object.freeze([VIRTUAL_ORGANIZATION_MANAGEMENT_LEVEL, ...PERSISTED_MANAGEMENT_LEVELS]);
const MANAGEMENT_LEVEL_ORDER = Object.freeze({ organization: 0, strategic: 1, tactical: 2, coordination: 3, operational: 4, administrative: 5 });
function isManagementLevel(value) { return Object.prototype.hasOwnProperty.call(MANAGEMENT_LEVEL_ORDER, value); }
function isPersistedManagementLevel(value) { return PERSISTED_MANAGEMENT_LEVELS.includes(value); }
function managementLevelOrder(value) { return MANAGEMENT_LEVEL_ORDER[value]; }
function withManagementLevelOrder(unit) { return unit ? { ...unit, levelOrder: managementLevelOrder(unit.managementLevel) } : unit; }
module.exports = { MANAGEMENT_LEVEL_CATALOG_VERSION, VIRTUAL_ORGANIZATION_MANAGEMENT_LEVEL, MANAGEMENT_LEVELS, PERSISTED_MANAGEMENT_LEVELS, MANAGEMENT_LEVEL_ORDER, isManagementLevel, isPersistedManagementLevel, managementLevelOrder, withManagementLevelOrder };
