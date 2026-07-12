'use strict'

module.exports = Object.freeze([
  {
    "name": "org.documents.read",
    "description": "Read tenant documents endpoint.",
    "domain": "org",
    "surface": "organization",
    "status": "active",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [
      "backend/index.js:GET /api/documents guarded by read:documents and legacy lms:read"
    ],
    "policyRequirements": [],
    "overlayMode": "restrictable",
    "dataScopeStrategy": "organization"
  },
  {
    "name": "org.documents.create",
    "description": "Create tenant documents endpoint.",
    "domain": "org",
    "surface": "organization",
    "status": "active",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [
      "backend/index.js:POST /api/documents guarded by create:documents and legacy members:write"
    ],
    "policyRequirements": [],
    "overlayMode": "restrictable",
    "dataScopeStrategy": "organization"
  },
  {
    "name": "org.members.read",
    "description": "Read tenant members after backend authz migration.",
    "domain": "org",
    "surface": "organization",
    "status": "planned",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [],
    "policyRequirements": [],
    "overlayMode": "restrictable"
  },
  {
    "name": "org.members.invite",
    "description": "Invite tenant members after backend authz migration.",
    "domain": "org",
    "surface": "organization",
    "status": "planned",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [],
    "policyRequirements": [],
    "overlayMode": "restrictable"
  },
  {
    "name": "org.impersonation.execute",
    "description": "Execute tenant impersonation after policy and hardening work.",
    "domain": "org",
    "surface": "organization",
    "status": "planned",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [],
    "policyRequirements": [
      "policy-layer#89",
      "hardening#83"
    ],
    "overlayMode": "restrictable"
  },
]);
