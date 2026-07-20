import { useEffect, useMemo, useState } from "react";
import { DataTable, DecisionState, EmptyState, FilterBar, MetricCard, RoleSelector, SectionCard, StatusPill, type DataTableColumn } from "../../../../shared/ui";
import type { GovernanceDataScopeAssignment, GovernanceRoleSummary } from "../../contracts";

type DraftTarget = { type: "dimension" | "unit" | "resource" | "relationship"; value: string; templateId: string; roleId: string };

const readUrlState = () => new URLSearchParams(globalThis.location?.search || "");
const writeUrlState = (updates: { role?: string; template?: string; filter?: string }) => {
  const params = readUrlState();
  for (const [key, value] of Object.entries(updates)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  const query = params.toString();
  globalThis.history?.replaceState(null, "", `${globalThis.location?.pathname || ""}${query ? `?${query}` : ""}`);
};

const assignmentRole = (assignment: GovernanceDataScopeAssignment) => assignment.canonicalRoleId || assignment.roleId || "unbound-role-path";
const assignmentTemplate = (assignment: GovernanceDataScopeAssignment) => assignment.scopeTemplateId || `${assignment.capability}:${assignment.scopeType || "scope"}`;
const targetSummary = (assignment: GovernanceDataScopeAssignment) => assignment.resourceSummary || assignment.dimensionValueId || assignment.unitId || assignment.relationshipKey || assignment.taxonomyIds[0] || assignment.unitIds[0] || "No target returned";
const decisionKind = (assignment: GovernanceDataScopeAssignment) => assignment.effective ? "allowed" : assignment.unresolvedReason ? "denied" : "limited";

const columns: DataTableColumn<GovernanceDataScopeAssignment>[] = [
  { key: "subject", header: "Membership role path", render: (assignment) => <div><strong>{assignment.membershipId || assignment.principalId}</strong><p className="text-xs text-muted">Role: {assignmentRole(assignment)}</p></div> },
  { key: "template", header: "Template / strategy", render: (assignment) => <div>{assignmentTemplate(assignment)}<p className="text-xs text-muted">{assignment.strategy || assignment.scopeType || "strategy not reported"}</p></div> },
  { key: "target", header: "Target", render: (assignment) => <div>{targetSummary(assignment)}<p className="text-xs text-muted">Type: {assignment.scopeType || assignment.targetKind || "unknown"}</p></div> },
  { key: "source", header: "Source", render: (assignment) => <span>{assignment.source ?? "explicit"}</span> },
  { key: "status", header: "Status", render: (assignment) => <StatusPill status={assignment.effective ? "success" : "warning"}>{assignment.effective ? "Effective" : "Unavailable"}</StatusPill> },
  { key: "version", header: "Version", render: (assignment) => <span className="text-xs text-muted">{assignment.sourceVersion ?? assignment.scopeTemplateVersion ?? "unversioned"}</span> },
  { key: "changed", header: "Changed", render: (assignment) => <span className="text-xs text-muted">{assignment.changedBy ?? "system"} · {assignment.changedAt ?? "not returned"}</span> },
  { key: "remove", header: "Remove", render: () => <button type="button" className="civitas-secondary-button" disabled title="Scope assignment changes are not available yet">Remove</button> },
];

export const DataScopeModule = ({ assignments, roles = [] }: { assignments: readonly GovernanceDataScopeAssignment[]; roles?: readonly GovernanceRoleSummary[] }) => {
  const [selectedRoleId, setSelectedRoleId] = useState(() => readUrlState().get("role") || "all");
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => readUrlState().get("template") || "all");
  const [filter, setFilter] = useState(() => readUrlState().get("filter") || "");
  const [draft, setDraft] = useState<DraftTarget>({ type: "dimension", value: "", templateId: "", roleId: "" });
  const roleOptions = useMemo(() => {
    const ids = new Set(assignments.map(assignmentRole));
    const options = roles.map((role) => ({ canonicalRoleId: role.id, alias: role.displayName, status: role.canonicalKey }));
    for (const id of ids) if (!options.some((role) => role.canonicalRoleId === id)) options.push({ canonicalRoleId: id, alias: id, status: "assignment role path" });
    return [{ canonicalRoleId: "all", alias: "All role paths", status: "filter" }, ...options];
  }, [assignments, roles]);
  const templateOptions = useMemo(() => ["all", ...new Set(assignments.map(assignmentTemplate))], [assignments]);
  const filteredAssignments = useMemo(() => assignments.filter((assignment) => {
    const query = filter.trim().toLowerCase();
    const matchesRole = selectedRoleId === "all" || assignmentRole(assignment) === selectedRoleId;
    const matchesTemplate = selectedTemplateId === "all" || assignmentTemplate(assignment) === selectedTemplateId;
    const matchesQuery = !query || `${assignment.principalId} ${assignment.membershipId ?? ""} ${assignmentRole(assignment)} ${assignmentTemplate(assignment)} ${targetSummary(assignment)} ${assignment.reason}`.toLowerCase().includes(query);
    return matchesRole && matchesTemplate && matchesQuery;
  }), [assignments, filter, selectedRoleId, selectedTemplateId]);
  const subjects = new Set(assignments.map((assignment) => assignment.membershipId || assignment.principalId)).size;
  const effective = assignments.filter((assignment) => assignment.effective).length;
  const unresolved = assignments.length - effective;
  const firstProblem = assignments.find((assignment) => !assignment.effective);
  const hasDraft = Boolean(draft.value.trim());

  useEffect(() => {
    if (!hasDraft) return undefined;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    globalThis.addEventListener?.("beforeunload", warn);
    return () => globalThis.removeEventListener?.("beforeunload", warn);
  }, [hasDraft]);

  const updateRole = (roleId: string) => { setSelectedRoleId(roleId); writeUrlState({ role: roleId === "all" ? "" : roleId }); };
  const updateTemplate = (templateId: string) => { setSelectedTemplateId(templateId); writeUrlState({ template: templateId === "all" ? "" : templateId }); };
  const updateFilter = (value: string) => { setFilter(value); writeUrlState({ filter: value }); };

  return (
    <>
      <SectionCard title="Scope assignments" description="Configure and review ABAC targets for a selected membership + canonical role path. This screen never creates organization-wide fallback access and never borrows scope across roles.">
        <div className="civitas-grid-3">
          <MetricCard label="Assignments" value={assignments.length} detail="Persisted governed assignments." />
          <MetricCard label="Membership paths" value={subjects} detail="Unique membership/role subjects." />
          <MetricCard label="Unresolved" value={unresolved} detail="Invalid, stale or unavailable scopes." variant={unresolved ? "warning" : "ok"} />
        </div>
        <DecisionState kind={firstProblem ? decisionKind(firstProblem) : assignments.length ? "allowed" : "pending"} title={firstProblem ? "Some assignments are not effective" : assignments.length ? "Assignments are scoped by role path" : "No assignment rows returned"} reasonCode={firstProblem?.unresolvedReason || firstProblem?.reason || (assignments.length ? "data_scope_role_path_bound" : "data_scope_assignment_missing")}>
          <p className="text-sm text-muted-strong">The backend remains the authority for template availability, same-tenant target validation, stale relationship checks and policy invalidation.</p>
        </DecisionState>
        <FilterBar searchLabel="Search scope assignments" searchValue={filter} onSearchChange={updateFilter} onReset={() => { setFilter(""); setSelectedRoleId("all"); setSelectedTemplateId("all"); writeUrlState({ role: "", template: "", filter: "" }); }}>
          <RoleSelector id="scope-role-filter" label="Role path" value={selectedRoleId} roles={roleOptions} onChange={updateRole} />
          <label className="civitas-form-field">
            <span className="civitas-form-field-label">Scope template</span>
            <select className="civitas-field" value={selectedTemplateId} onChange={(event) => updateTemplate(event.target.value)}>
              {templateOptions.map((template) => <option key={template} value={template}>{template === "all" ? "All templates" : template}</option>)}
            </select>
          </label>
        </FilterBar>
      </SectionCard>
      <div className="civitas-grid-2">
        <SectionCard title="Review assignments" description="Review scope type, target, source, status, version, actor metadata and safe removal state.">
          <DataTable columns={columns} data={[...filteredAssignments]} getKey={(assignment, index) => assignment.id || `${assignment.principalId}-${assignmentTemplate(assignment)}-${index}`} emptyState={<EmptyState message="No data-scope assignments"><p className="text-sm text-muted-strong">No governed data scopes match this role/template filter. Missing scope fails closed.</p></EmptyState>} />
        </SectionCard>
        <SectionCard title="Add target preview" description="Typed picker preview only. Only server-approved templates and same-tenant targets may be persisted by the owning data-scope API.">
          <div className="civitas-workspace-stack">
            <label className="civitas-form-field">
              <span className="civitas-form-field-label">Target type</span>
              <select className="civitas-field" value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as DraftTarget["type"] }))}>
                <option value="dimension">Dimension value</option>
                <option value="unit">Organization unit</option>
                <option value="relationship">Registered relationship</option>
                <option value="resource">Resource reference</option>
              </select>
            </label>
            <label className="civitas-form-field">
              <span className="civitas-form-field-label">Target stable ID</span>
              <input className="civitas-field" value={draft.value} onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))} placeholder="Server-resolved target ID" />
            </label>
            <p className="text-sm text-muted-strong">Draft target <strong>{draft.value || "not selected"}</strong> will not be saved here. Cross-tenant, stale and template-incompatible targets must be rejected by the backend before saving.</p>
            {hasDraft ? <DecisionState kind="unavailable" title="Unsaved target draft" reasonCode="scope_assignment_write_unavailable"><p className="text-sm text-muted-strong">Your draft is preserved locally and browser navigation will warn before leaving.</p></DecisionState> : null}
            <div className="civitas-action-bar">
              <button type="button" className="civitas-secondary-button" onClick={() => setDraft({ type: "dimension", value: "", templateId: "", roleId: "" })} disabled={!hasDraft}>Discard draft</button>
              <button type="button" className="civitas-primary-button" disabled title="Scope assignment changes are not available yet">Add target</button>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
};
