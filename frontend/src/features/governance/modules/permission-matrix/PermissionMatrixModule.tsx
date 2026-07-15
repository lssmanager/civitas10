import { DataTable, EmptyState, SectionCard, StatusPill, type DataTableColumn } from "../../../../shared/ui";
import type { GovernancePermissionMatrixRow, GovernanceSurface, PermissionMatrixReason } from "../../contracts";

import { formatSourceVersions, reasonLabel, reasonToneClass } from "./reason-format";

const BooleanCell = ({ value, emphatic = false }: { value: boolean | null; emphatic?: boolean }) => {
  if (value === null) return <span className="text-muted" aria-label="not applicable">Not applicable</span>;
  return <StatusPill status={value ? "success" : emphatic ? "danger" : "warning"}>{value ? "Allowed" : "Denied"}</StatusPill>;
};

const ReasonCell = ({ reason }: { reason: PermissionMatrixReason }) => (
  <div>
    <span className={reasonToneClass(reason.code)}>{reasonLabel(reason.code)}</span>
    <div className="text-xs text-muted">{formatSourceVersions(reason.sourceVersions)}</div>
  </div>
);

const columns: DataTableColumn<GovernancePermissionMatrixRow>[] = [
  { key: "permission", header: "Permission", render: (row) => <span className="font-medium text-text">{row.roleKey ? `${row.roleKey} · ` : ""}{row.permission}</span> },
  { key: "canonical", header: "Canonical", render: (row) => <BooleanCell value={row.canonical} /> },
  { key: "rolePotential", header: "Role potential", render: (row) => <BooleanCell value={row.reason.code === "not_canonical" ? null : row.rolePotential} /> },
  { key: "ownerAllowed", header: "Owner allowed", render: (row) => <BooleanCell value={row.reason.code === "not_canonical" ? null : row.ownerAllowed} /> },
  { key: "tenantEnabled", header: "Tenant enabled", render: (row) => <BooleanCell value={row.tenantEnabled} /> },
  { key: "effective", header: "Effective", render: (row) => <BooleanCell value={row.effective} emphatic /> },
  { key: "reason", header: "Reason", render: (row) => <ReasonCell reason={row.reason} /> },
];

export const PermissionMatrixModule = ({ rows, surface }: { rows: readonly GovernancePermissionMatrixRow[]; surface: GovernanceSurface }) => (
  <SectionCard title={surface === "owner" ? "Roles and permissions" : "Active permissions"} description="Review the returned permission decisions and the first reason that limits an effective permission.">
    <DataTable columns={columns} data={[...rows]} getKey={(row) => `${row.roleId || "global"}:${row.permission}`} emptyState={<EmptyState message="No permission evaluation available"><p className="text-sm text-muted-strong">The organization does not yet have permission evaluation data.</p></EmptyState>} />
  </SectionCard>
);
