'use strict'

module.exports = Object.freeze([
  {
    "name": "scheduling.bookings.read",
    "description": "Read scheduling bookings once scheduling consumers are implemented.",
    "domain": "scheduling",
    "surface": "organization",
    "status": "planned",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [],
    "policyRequirements": [],
    "overlayMode": "restrictable"
  },
  {
    "name": "scheduling.availability.manage",
    "description": "Manage scheduling availability after contract expansion.",
    "domain": "scheduling",
    "surface": "organization",
    "status": "planned",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [],
    "policyRequirements": [],
    "overlayMode": "restrictable"
  }
]);
