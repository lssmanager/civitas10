"use strict";

const { GLOBAL_ROLES, ORGANIZATION_ROLES } = require("../authorization/roles");
const { requirePermission } = require("../middleware/requirePermission");
const { requireOrg } = require("../middleware/requireOrg");
const { requireSeats } = require("../middleware/requireSeats");

function getPermissionsForRoles() {
  return [];
}

function hasPermission() {
  return false;
}

module.exports = {
  GLOBAL_ROLES,
  ORGANIZATION_ROLES,
  getPermissionsForRoles,
  hasPermission,
  requireOrg,
  requirePermission,
  requireSeats,
};
