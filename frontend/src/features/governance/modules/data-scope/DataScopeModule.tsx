import { DataTable, EmptyState, MetricCard, SectionCard, StatusPill, type DataTableColumn } from "../../../../shared/ui";
import type { GovernanceDataScopeAssignment } from "../../contracts";

const columns: DataTableColumn<GovernanceDataScopeAssignment>[] = [
  { key: "subject", header: "Subject", render: (assignment) => <span className="font-medium text-text">{assignment.principalId}</span> },
  { key: "resource", header: "Scope/resource", render: (assignment) => assignment.resourceSummary || assignment.capability },
  { key: "taxonomy", header: "Taxonomy", render: (assignment) => assignment.taxonomyIds.length ? assignment.taxonomyIds.join(", ") : "None" },
  { key: "groups", header: "Groups", render: (assignment) => assignment.unitIds.length ? assignment.unitIds.join(", ") : "None" },
  { key: "status", header: "Status", render: (assignment) => <StatusPill status={assignment.effective ? "success" : "warning"}>{assignment.effective ? "Effective" : "Limited"}</StatusPill> },
  { key: "reason", header: "Reason", render: (assignment) => assignment.reason },
];

export const DataScopeModule = ({ assignments }: { assignments: readonly GovernanceDataScopeAssignment[] }) => {
  const subjects = new Set(assignments.map((assignment) => assignment.principalId)).size;
  const effective = assignments.filter((assignment) => assignment.effective).length;
  const unresolved = assignments.length - effective;
  return (
    <SectionCard title="Data-scope assignments" description="Visualize which subjects have access to governed data segments for this organization.">
      <div className="civitas-grid-3">
        <MetricCard label="Assignments" value={assignments.length} detail="Returned governed assignments." />
        <MetricCard label="Subjects" value={subjects} detail="Unique subjects in the returned data." />
        <MetricCard label="Unresolved" value={unresolved} detail="Assignments that are limited or unresolved." variant={unresolved ? "warning" : "ok"} />
      </div>
      <DataTable columns={columns} data={[...assignments]} getKey={(assignment, index) => `${assignment.principalId}-${assignment.capability}-${index}`} emptyState={<EmptyState message="No data-scope assignments"><p className="text-sm text-muted-strong">No subjects have been assigned a governed data scope for this organization.</p></EmptyState>} />
    </SectionCard>
  );
};
