'use strict'

module.exports = Object.freeze([
  {
    "name": "lms.groups.read",
    "description": "Read tenant-scoped LMS groups authorized by group-leadership ABAC.",
    "domain": "lms",
    "surface": "organization",
    "status": "active",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [
      "backend/index.js:GET /o/:organizationId/lms/groups guarded by lms.groups.read",
      "backend/index.js:GET /o/:organizationId/lms/groups/:groupId guarded by lms.groups.read"
    ],
    "policyRequirements": ["same-organization", "org-role-entitlement-enabled", "data-scope-required"],
    "overlayMode": "restrictable",
    "dataScopeStrategy": "group_leadership"
  },
  {
    "name": "lms.group_members.read",
    "description": "Read members/composition for tenant-scoped LMS groups authorized by group-leadership ABAC.",
    "domain": "lms",
    "surface": "organization",
    "status": "active",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [
      "backend/index.js:GET /o/:organizationId/lms/groups/:groupId/members guarded by lms.group_members.read"
    ],
    "policyRequirements": ["same-organization", "org-role-entitlement-enabled", "data-scope-required"],
    "overlayMode": "restrictable",
    "dataScopeStrategy": "group_leadership"
  },
  {
    "name": "lms.course_offerings.read",
    "description": "Read course offerings linked to tenant-scoped LMS groups authorized by group-leadership ABAC.",
    "domain": "lms",
    "surface": "organization",
    "status": "active",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [
      "backend/index.js:GET /o/:organizationId/lms/groups/:groupId guarded by lms.course_offerings.read"
    ],
    "policyRequirements": ["same-organization", "org-role-entitlement-enabled", "data-scope-required"],
    "overlayMode": "restrictable",
    "dataScopeStrategy": "group_leadership"
  },
  {
    "name": "lms.documents.read",
    "description": "Legacy LMS document read compatibility candidate; not assigned by canonical matrix.",
    "domain": "lms",
    "surface": "organization",
    "status": "planned",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [],
    "policyRequirements": [],
    "overlayMode": "restrictable"
  },
  {
    "name": "lms.student_profiles.read",
    "description": "Read minimal student profiles after a dedicated endpoint and redaction contract exists.",
    "domain": "lms",
    "surface": "organization",
    "status": "planned",
    "resource": "https://civitas.didaxus.com/api",
    "consumers": [],
    "policyRequirements": ["privacy-redaction-contract"],
    "overlayMode": "restrictable",
    "dataScopeStrategy": "group_leadership"
  }
]);
