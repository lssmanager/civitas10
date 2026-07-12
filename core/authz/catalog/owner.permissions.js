'use strict'

module.exports = Object.freeze([
  {
    "name": "owner.profile.read",
    "description": "Read current owner identity and authorization context.",
    "domain": "owner",
    "surface": "global",
    "status": "active",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [
      "backend/index.js:GET /api/owner/me",
      "frontend/src/api/me.ts:load current user context"
    ],
    "policyRequirements": [],
    "overlayMode": "not-applicable",
    "screenActionIds": [
      "owner.me.read"
    ]
  },
  {
    "name": "owner.organizations.read",
    "description": "Read owner organization inventory and organization template data.",
    "domain": "owner",
    "surface": "global",
    "status": "active",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [
      "backend/index.js:GET /api/owner/organizations",
      "backend/index.js:GET /api/owner/organization-template",
      "frontend/src/api/owner.ts:owner organizations queries"
    ],
    "policyRequirements": [],
    "overlayMode": "not-applicable",
    "screenActionIds": [
      "owner.organizations.read"
    ]
  },
  {
    "name": "owner.organizations.create",
    "description": "Create a tenant organization from the owner console.",
    "domain": "owner",
    "surface": "global",
    "status": "active",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [
      "backend/index.js:POST /api/owner/organizations",
      "backend/index.js:POST /api/organizations",
      "frontend/src/authz/rbacMatrix.ts:owner.organization.create"
    ],
    "policyRequirements": [],
    "overlayMode": "not-applicable",
    "screenActionIds": [
      "owner.organization.create"
    ]
  },
  {
    "name": "owner.runtime.read",
    "description": "Read owner operational runtime and registry diagnostics.",
    "domain": "owner",
    "surface": "global",
    "status": "active",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [
      "backend/index.js:GET /api/owner/organizations/:organizationId/operational-state",
      "backend/index.js:GET /api/owner/system/registry"
    ],
    "policyRequirements": [],
    "overlayMode": "not-applicable",
    "screenActionIds": [
      "owner.runtime.read"
    ]
  },
  {
    "name": "owner.runtime.operations.execute",
    "description": "Execute owner runtime operations.",
    "domain": "owner",
    "surface": "global",
    "status": "active",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [
      "backend/index.js:POST /api/owner/system/operations",
      "frontend/src/authz/rbacMatrix.ts:owner.system.refresh"
    ],
    "policyRequirements": [],
    "overlayMode": "not-applicable",
    "screenActionIds": [
      "owner.system.refresh"
    ]
  },
  {
    "name": "owner.worker_queues.read",
    "description": "Read worker queue observability.",
    "domain": "owner",
    "surface": "global",
    "status": "active",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [
      "backend/index.js:GET /api/owner/system/worker-queues",
      "frontend/src/api/owner.ts:getWorkerQueuesObservability"
    ],
    "policyRequirements": [],
    "overlayMode": "not-applicable",
    "screenActionIds": [
      "owner.worker_queues.read"
    ]
  },
  {
    "name": "owner.audit.logs.read",
    "description": "Read owner cross-organization audit logs when implemented.",
    "domain": "owner",
    "surface": "global",
    "status": "planned",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [],
    "policyRequirements": [],
    "overlayMode": "not-applicable"
  },
  {
    "name": "owner.analytics.reports.read",
    "description": "Read owner cross-organization analytics reports when implemented.",
    "domain": "owner",
    "surface": "global",
    "status": "planned",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [],
    "policyRequirements": [],
    "overlayMode": "not-applicable"
  },
  {
    "name": "owner.impersonation.execute",
    "description": "Execute owner impersonation subject to future policy gates.",
    "domain": "owner",
    "surface": "global",
    "status": "planned",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [],
    "policyRequirements": [
      "policy-layer#89",
      "hardening#83"
    ],
    "overlayMode": "not-applicable"
  },
  {
    "name": "owner.seat_change_requests.read",
    "description": "Read tenant seat change requests.",
    "domain": "owner",
    "surface": "global",
    "status": "planned",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [],
    "policyRequirements": [],
    "overlayMode": "not-applicable"
  },
  {
    "name": "owner.seat_change_requests.approve",
    "description": "Approve tenant seat change requests.",
    "domain": "owner",
    "surface": "global",
    "status": "planned",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [],
    "policyRequirements": [],
    "overlayMode": "not-applicable"
  },
  {
    "name": "owner.seat_change_requests.reject",
    "description": "Reject tenant seat change requests.",
    "domain": "owner",
    "surface": "global",
    "status": "planned",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [],
    "policyRequirements": [],
    "overlayMode": "not-applicable"
  }
]);
