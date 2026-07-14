import { DataTable, EmptyState, SectionCard, StatusPill, type DataTableColumn } from "../../../../shared/ui";
import type { GovernanceTaxonomyItem } from "../../contracts";

const columns: DataTableColumn<GovernanceTaxonomyItem>[] = [
  { key: "name", header: "Name", render: (item) => <span className="font-medium text-text">{item.label}</span> },
  { key: "category", header: "Category", render: (item) => item.dimension },
  { key: "status", header: "Status", render: (item) => <StatusPill status={item.status === "active" ? "success" : "warning"}>{item.status === "active" ? "Active" : "Archived"}</StatusPill> },
  { key: "assignable", header: "Assignable", render: (item) => <StatusPill status={item.assignable ? "success" : "neutral"}>{item.assignable ? "Assignable" : "Read-only"}</StatusPill> },
  { key: "id", header: "ID", render: (item) => <span className="text-xs text-muted">{item.id}</span> },
];

export const TaxonomyModule = ({ items }: { items: readonly GovernanceTaxonomyItem[] }) => (
  <SectionCard title="Organization taxonomy" description="Inspect taxonomy values that help organize filters and governed data scopes.">
    <DataTable columns={columns} data={[...items]} getKey={(item) => item.id} emptyState={<EmptyState message="No taxonomy values"><p className="text-sm text-muted-strong">This organization has not configured taxonomy values yet.</p></EmptyState>} />
  </SectionCard>
);
