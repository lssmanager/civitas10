'use strict'
module.exports = Object.freeze({
  organization_admin: Object.freeze(['org.documents.create', 'org.documents.read']),
  organization_director: Object.freeze(['org.documents.read']),
  organization_headdirector: Object.freeze(['org.documents.read']),
  organization_headteacher: Object.freeze(['org.documents.read']),
  organization_groupleader: Object.freeze(['lms.groups.read', 'lms.group_members.read', 'lms.course_offerings.read']),
  organization_teacher: Object.freeze(['org.documents.read']),
  organization_student: Object.freeze(['org.documents.read']),
  organization_parent: Object.freeze(['org.documents.read']),
  organization_secretary: Object.freeze(['org.documents.read']),
  organization_accountant: Object.freeze([]),
  organization_billing: Object.freeze([]),
  organization_payroll: Object.freeze([]),
  organization_member: Object.freeze(['org.documents.read']),
})
