'use strict'

// Canonical Logto role names only. Roles are context/provenance; they never grant scopes.
const GLOBAL_ROLES = Object.freeze({ OWNER: 'owner_global' })
const ORGANIZATION_ROLES = Object.freeze({
  ACCOUNTANT: 'organization_accountant',
  ADMIN: 'organization_admin',
  BILLING: 'organization_billing',
  DIRECTOR: 'organization_director',
  HEADDIRECTOR: 'organization_headdirector',
  HEADTEACHER: 'organization_headteacher',
  GROUPLEADER: 'organization_groupleader',
  MEMBER: 'organization_member',
  PARENT: 'organization_parent',
  PAYROLL: 'organization_payroll',
  SECRETARY: 'organization_secretary',
  STUDENT: 'organization_student',
  TEACHER: 'organization_teacher',
})

module.exports = { GLOBAL_ROLES, ORGANIZATION_ROLES }
