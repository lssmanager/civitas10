import { DataTable, EmptyState, SectionCard, StatusPill, type DataTableColumn } from "../../../../shared/ui";
import type { GovernanceMemberSummary } from "../../contracts";

const columns: DataTableColumn<GovernanceMemberSummary>[] = [
  { key: "display", header: "Member", render: (member) => <span className="font-medium text-text">{member.display}</span> },
  { key: "roles", header: "Canonical roles", render: (member) => <div className="flex flex-wrap gap-1">{member.roleAliases.length ? member.roleAliases.map((role) => <StatusPill key={role} status="neutral">{role}</StatusPill>) : <span className="text-muted">No roles</span>}</div> },
  { key: "dataScope", header: "Data scope", render: (member) => <span>{member.dataScopeSummary}</span> },
  { key: "actions", header: "Assignment actions", render: (member) => <span className="text-muted-strong">{member.allowedAssignmentActions.length ? member.allowedAssignmentActions.join(", ") : "Read-only"}</span> },
];

export const MembersRoleAssignmentsModule = ({ members }: { members: readonly GovernanceMemberSummary[] }) => (
  <SectionCard title="Members" description="Review identity-safe member assignments returned by the tenant governance read model.">
    <DataTable columns={columns} data={[...members]} getKey={(member) => member.id} emptyState={<EmptyState message="No member assignments are available"><p className="text-sm text-muted-strong">The backend returned an empty member directory for this organization.</p></EmptyState>} />
  </SectionCard>
);
