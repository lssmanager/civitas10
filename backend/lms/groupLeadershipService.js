"use strict";

const { queryPostgres } = require("../lib/db");
const { evaluateOrganizationEntitlement } = require("../authorization/entitlements");
const { createDataScopeEvaluator, DATA_SCOPE_REASON_CODES } = require("../authorization/data-scope");

const LMS_GROUPS_CONTRACT_VERSION = "2026-07-civitas10-lms-groups-v1";
const GROUP_LEADER_ROLE = "organization_groupleader";
const GROUP_RELATIONSHIP_KEY = "academic.assigned_group";

function lmsGroupError(code, status = 403, details = {}) { return Object.assign(new Error(code), { code, status, safeDetails: details }); }
function targetRefsFromConstraint(constraint) {
  if (!constraint || constraint.kind === "deny") return [];
  const clauses = Array.isArray(constraint.clauses) ? constraint.clauses : [];
  return [...new Set(clauses.filter((clause) => clause.relationshipKey === GROUP_RELATIONSHIP_KEY).flatMap((clause) => clause.targetRefs || []))];
}
function groupMatchesTarget(group, ref) { return [group.id, group.unitId, group.stableKey].filter(Boolean).map(String).includes(String(ref)); }
function normalizeRolePaths(principal = {}) {
  if (Array.isArray(principal.rolePaths) && principal.rolePaths.length) return principal.rolePaths;
  const roles = Array.isArray(principal.organizationRoles) ? principal.organizationRoles : [];
  const scopes = principal.scopes instanceof Set ? principal.scopes : new Set(Array.isArray(principal.scopes) ? principal.scopes : []);
  return roles.map((role) => ({ rolePathId: `${role}:self`, logtoRoleId: role, canonicalRoleId: role, roleNameCache: role, roleKey: role, membershipId: principal.membershipId || principal.claims?.membership_id || `${principal.subject || "subject"}:${role}`, tokenScopePresent: scopes.has(role) }));
}

function createPostgresLmsGroupRepository({ query = queryPostgres } = {}) {
  return {
    async listGroupsByIds(input) {
      const orgId = input["organization" + "Id"];
      const groupIds = input.groupIds || [];
      if (!groupIds.length) return [];
      const result = await query("select id::text, logto_organization_id, stable_key, display_name, summary, unit_id::text, status, metadata from lms_academic_groups where logto_organization_id = $1 and status = 'active' and (id::text = any($2::text[]) or unit_id::text = any($2::text[]) or stable_key = any($2::text[])) order by display_name", [orgId, groupIds.map(String)]);
      return result.rows.map(mapGroupRow);
    },
    async getGroup(input) {
      const orgId = input["organization" + "Id"];
      const groupId = input.groupId;
      const result = await query("select id::text, logto_organization_id, stable_key, display_name, summary, unit_id::text, status, metadata from lms_academic_groups where logto_organization_id = $1 and status = 'active' and (id::text = $2 or stable_key = $2) limit 1", [orgId, String(groupId)]);
      return result.rows[0] ? mapGroupRow(result.rows[0]) : null;
    },
    async listMembers(input) {
      const orgId = input["organization" + "Id"];
      const groupId = input.groupId;
      const result = await query("select id::text, member_ref, display_name, member_type, status, metadata from lms_group_members where logto_organization_id = $1 and group_id::text = $2 and status = 'active' order by member_type, display_name", [orgId, String(groupId)]);
      return result.rows.map((row) => ({ id: row.id, memberRef: row.member_ref, displayName: row.display_name, memberType: row.member_type, status: row.status, metadata: row.metadata || {} }));
    },
    async listCourseOfferings(input) {
      const orgId = input["organization" + "Id"];
      const groupId = input.groupId;
      const result = await query("select id::text, course_ref, display_name, subject_key, teacher_ref, status, metadata from lms_course_offerings where logto_organization_id = $1 and group_id::text = $2 and status = 'active' order by display_name", [orgId, String(groupId)]);
      return result.rows.map((row) => ({ id: row.id, courseRef: row.course_ref, displayName: row.display_name, subjectKey: row.subject_key, teacherRef: row.teacher_ref, status: row.status, metadata: row.metadata || {} }));
    },
    async listLeadershipCandidates(input) {
      const orgId = input["organization" + "Id"];
      const { subjectId, logtoRoleId, membershipId, canonicalRoleId, capability } = input;
      const result = await query("select m.id::text as membership_id, m.unit_id::text, m.relationship_type, m.valid_from, m.valid_until, g.id::text as group_id from organization_unit_memberships m join lms_academic_groups g on g.logto_organization_id = m.logto_organization_id and g.unit_id = m.unit_id where m.logto_organization_id = $1 and m.logto_user_id = $2 and m.relationship_type = 'leads' and m.status = 'active' and (m.logto_role_id is null or m.logto_role_id = $3) and g.status = 'active'", [orgId, subjectId, logtoRoleId]);
      return result.rows.map((row) => ({ candidateId: row.membership_id, ["organization" + "Id"]: orgId, subjectId, logtoRoleId, membershipId, canonicalRoleId, capability, unitId: row.group_id, source: { type: "unit_membership", id: row.membership_id, relationshipType: row.relationship_type }, validFrom: row.valid_from, validUntil: row.valid_until }));
    },
  };
}
function mapGroupRow(row) { return { id: row.id, ["organization" + "Id"]: row.logto_organization_id, stableKey: row.stable_key, displayName: row.display_name, summary: row.summary, unitId: row.unit_id, status: row.status, metadata: row.metadata || {} }; }

function createLmsGroupLeadershipService({ groupRepository = createPostgresLmsGroupRepository(), entitlementRepository, dataScopeRepository, auditPort, roleIdToName = {} } = {}) {
  if (!entitlementRepository || !dataScopeRepository) throw lmsGroupError("lms_group_authorization_dependencies_missing", 500);
  async function audit(event) { if (auditPort?.audit) await auditPort.audit({ contractVersion: LMS_GROUPS_CONTRACT_VERSION, ...event, timestamp: new Date().toISOString() }); }
  async function authorize({ organizationId, principal, permission, targetGroupId }) {
    const rolePaths = normalizeRolePaths(principal);
    const tokenScopes = principal?.scopes instanceof Set ? principal.scopes : new Set(principal?.scopes || []);
    const entitlement = await evaluateOrganizationEntitlement({ organizationId, subject: principal?.subject, tokenScopes, rolePaths, permission, repository: entitlementRepository, roleIdToName });
    if (!entitlement.allowed) return { allowed: false, reasonCode: entitlement.reasonCode, status: 403, entitlement };
    const allowedPathIds = new Set(entitlement.evaluatedRolePaths.filter((path) => path.allowed).map((path) => path.rolePathId));
    const abacPrincipal = { subject: principal?.subject, scopes: tokenScopes, rolePaths: rolePaths.filter((path) => allowedPathIds.has(path.rolePathId)).map((path) => ({ ...path, entitlementAllowed: true })) };
    const evaluator = createDataScopeEvaluator({ repository: dataScopeRepository, scopeCandidateProvider: { listCandidates: (input) => groupRepository.listLeadershipCandidates(input) }, roleIdToKey: { ...roleIdToName, [GROUP_LEADER_ROLE]: GROUP_LEADER_ROLE } });
    const dataScope = await evaluator.evaluate({ organizationId, principal: abacPrincipal, permission, capability: "lms" });
    const refs = targetRefsFromConstraint(dataScope.constraint);
    const allowed = dataScope.allowed && (!targetGroupId || refs.some((ref) => String(ref) === String(targetGroupId)));
    const abacReason = dataScope.rolePaths?.find((path) => path.reasonCode && path.reasonCode !== "data_scope_allowed")?.reasonCode || dataScope.reasonCode || DATA_SCOPE_REASON_CODES.ASSIGNMENT_MISSING;
    return { allowed, reasonCode: allowed ? "allowed" : abacReason, status: allowed ? 200 : 403, entitlement, dataScope, targetRefs: refs };
  }
  async function listGroups({ organizationId, principal, permission = "lms.groups.read" }) {
    const decision = await authorize({ organizationId, principal, permission });
    if (!decision.allowed) { await audit({ action: "lms.groups.list", organizationId, actor: principal?.subject, result: "denied", reasonCode: decision.reasonCode }); throw lmsGroupError(decision.reasonCode, decision.status); }
    const groups = await groupRepository.listGroupsByIds({ organizationId, groupIds: decision.targetRefs });
    await audit({ action: "lms.groups.list", organizationId, actor: principal?.subject, result: "allowed", reasonCode: "allowed", targetGroupIds: groups.map((g) => g.id) });
    return { contractVersion: LMS_GROUPS_CONTRACT_VERSION, authorization: { reasonCode: "allowed", visibleGroupCount: groups.length }, groups };
  }
  async function getGroupDetail({ organizationId, groupId, principal }) {
    const group = await groupRepository.getGroup({ organizationId, groupId });
    if (!group) throw lmsGroupError("resource_wrong_tenant", 404);
    const decision = await authorize({ organizationId, principal, permission: "lms.groups.read" });
    const allowed = decision.allowed && decision.targetRefs.some((ref) => groupMatchesTarget(group, ref));
    if (!allowed) { await audit({ action: "lms.groups.detail", organizationId, actor: principal?.subject, targetGroupId: group.id, result: "denied", reasonCode: decision.reasonCode }); throw lmsGroupError(decision.reasonCode, 403); }
    const courseDecision = await authorize({ organizationId, principal, permission: "lms.course_offerings.read" });
    const courses = courseDecision.allowed && courseDecision.targetRefs.some((ref) => groupMatchesTarget(group, ref)) ? await groupRepository.listCourseOfferings({ organizationId, groupId: group.id }) : [];
    await audit({ action: "lms.groups.detail", organizationId, actor: principal?.subject, targetGroupId: group.id, result: "allowed", reasonCode: "allowed" });
    return { contractVersion: LMS_GROUPS_CONTRACT_VERSION, authorization: { reasonCode: "allowed", courseOfferingsReadable: courses.length > 0 || courseDecision.allowed }, group: { ...group, courseOfferings: courses } };
  }
  async function listGroupMembers({ organizationId, groupId, principal }) {
    const group = await groupRepository.getGroup({ organizationId, groupId });
    if (!group) throw lmsGroupError("resource_wrong_tenant", 404);
    const decision = await authorize({ organizationId, principal, permission: "lms.group_members.read" });
    const allowed = decision.allowed && decision.targetRefs.some((ref) => groupMatchesTarget(group, ref));
    if (!allowed) { await audit({ action: "lms.groups.members", organizationId, actor: principal?.subject, targetGroupId: group.id, result: "denied", reasonCode: decision.reasonCode }); throw lmsGroupError(decision.reasonCode, 403); }
    const members = await groupRepository.listMembers({ organizationId, groupId: group.id });
    await audit({ action: "lms.groups.members", organizationId, actor: principal?.subject, targetGroupId: group.id, result: "allowed", reasonCode: "allowed", returnedRows: members.length });
    return { contractVersion: LMS_GROUPS_CONTRACT_VERSION, authorization: { reasonCode: "allowed", returnedRows: members.length }, group: { id: group.id, displayName: group.displayName }, members };
  }
  return { authorize, listGroups, getGroupDetail, listGroupMembers };
}

module.exports = { LMS_GROUPS_CONTRACT_VERSION, GROUP_LEADER_ROLE, createPostgresLmsGroupRepository, createLmsGroupLeadershipService, targetRefsFromConstraint };
