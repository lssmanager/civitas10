'use strict'

// IMPORTANTE: estos nombres deben coincidir EXACTAMENTE con los roles
// configurados en Logto Console y emitidos en el JWT.
// Roles de organización verificados:
// - organization_accountant
// - organization_admin
// - organization_billing
// - organization_director
// - organization_headdirector
// - organization_headteacher
// - organization_member
// - organization_parent
// - organization_payroll
// - organization_secretary
// - organization_student
// - organization_teacher
// Verificar además el rol global real del owner contra JWT real.

const GLOBAL_ROLES = {
  OWNER: 'owner_global',
  SUPPORT_AGENT: 'support_agent',
}

const ORGANIZATION_ROLES = {
  ACCOUNTANT: 'organization_accountant',
  ADMIN: 'organization_admin',
  BILLING: 'organization_billing',
  DIRECTOR: 'organization_director',
  HEADDIRECTOR: 'organization_headdirector',
  HEADTEACHER: 'organization_headteacher',
  MEMBER: 'organization_member',
  PARENT: 'organization_parent',
  PAYROLL: 'organization_payroll',
  SECRETARY: 'organization_secretary',
  STUDENT: 'organization_student',
  TEACHER: 'organization_teacher',
}

const ROLE_PERMISSIONS = {
  [GLOBAL_ROLES.OWNER]: ['*'],

  [GLOBAL_ROLES.SUPPORT_AGENT]: [
    'organizations:read',
    'members:read',
    'support:read',
    'operations:read',
    'audit:read',
  ],

  [ORGANIZATION_ROLES.ADMIN]: [
    'members:read',
    'members:invite',
    'members:write',
    'members:remove',
    'seats:read',
    'seats:assign',
    'seats:release',
    'connectors:read',
    'connectors:configure',
    'lms:read',
    'lms:enroll',
    'lms:manage',
    'crm:read',
    'crm:write',
    'support:read',
    'support:write',
    'scheduling:read',
    'scheduling:book',
    'payments:read',
    'audit:read',
  ],

  [ORGANIZATION_ROLES.TEACHER]: [
    'members:read',
    'lms:read',
    'support:read',
    'support:write',
    'scheduling:read',
    'scheduling:book',
  ],

  [ORGANIZATION_ROLES.STUDENT]: [
    'lms:read',
    'scheduling:read',
    'scheduling:book',
    'support:write',
  ],

  [ORGANIZATION_ROLES.MEMBER]: [
    'lms:read',
    'scheduling:read',
    'scheduling:book',
    'support:write',
  ],

  [ORGANIZATION_ROLES.HEADTEACHER]: [
    'members:read',
    'lms:read',
    'lms:enroll',
    'lms:manage',
    'support:read',
    'support:write',
    'scheduling:read',
    'scheduling:book',
    'audit:read',
  ],

  [ORGANIZATION_ROLES.DIRECTOR]: [
    'members:read',
    'lms:read',
    'crm:read',
    'support:read',
    'payments:read',
    'audit:read',
  ],

  [ORGANIZATION_ROLES.HEADDIRECTOR]: [
    'members:read',
    'members:invite',
    'lms:read',
    'crm:read',
    'payments:read',
    'audit:read',
  ],

  [ORGANIZATION_ROLES.BILLING]: [
    'payments:read',
    'payments:write',
    'audit:read',
  ],

  [ORGANIZATION_ROLES.ACCOUNTANT]: [
    'payments:read',
    'audit:read',
  ],

  [ORGANIZATION_ROLES.PAYROLL]: [
    'payments:read',
    'audit:read',
  ],

  [ORGANIZATION_ROLES.SECRETARY]: [
    'members:read',
    'scheduling:read',
    'scheduling:book',
    'support:write',
  ],

  [ORGANIZATION_ROLES.PARENT]: [
    'lms:read',
    'scheduling:read',
    'support:write',
  ],
}

module.exports = { GLOBAL_ROLES, ORGANIZATION_ROLES, ROLE_PERMISSIONS }
