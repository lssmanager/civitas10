import { DataTable, EmptyState, SectionCard, StatusPill, type DataTableColumn } from "../../../../shared/ui";
import type { GovernanceUnitItem } from "../../contracts";

const columns: DataTableColumn<GovernanceUnitItem>[] = [
  { key: "group", header: "Group", render: (unit) => <span className="font-medium text-text">{unit.label}</span> },
  { key: "unit", header: "Unit", render: (unit) => unit.parentId || "Root" },
  { key: "members", header: "Members", render: (unit) => String(unit.memberCount ?? 0) },
  { key: "status", header: "Status", render: (unit) => <StatusPill status={unit.status === "active" ? "success" : "warning"}>{unit.status === "active" ? "Active" : "Archived"}</StatusPill> },
];

export const UnitsModule = ({ units }: { units: readonly GovernanceUnitItem[] }) => (
  <SectionCard title="Groups" description="Groups organize membership for governance review; access is determined separately.">
    <DataTable columns={columns} data={[...units]} getKey={(unit) => unit.id} emptyState={<EmptyState message="No groups"><p className="text-sm text-muted-strong">This organization has not returned groups for governance review yet.</p></EmptyState>} />
  </SectionCard>
);
