import { SectionCard, StatusPill } from "../../../../shared/ui";
import type { GovernancePermissionMatrixRow, GovernanceSurface, PermissionMatrixReason } from "../../contracts";

import { formatSourceVersions, reasonLabel, reasonToneClass } from "./reason-format";

const BooleanCell = ({ value }: { value: boolean | null }) => {
  if (value === null) return <span className="font-mono text-muted" aria-label="not applicable">—</span>;
  return <StatusPill status={value ? "success" : "warning"}>{value ? "yes" : "no"}</StatusPill>;
};

const ReasonCell = ({ reason }: { reason: PermissionMatrixReason }) => (
  <div>
    <span className={reasonToneClass(reason.code)}>{reasonLabel(reason.code)}</span>
    <div className="text-xs font-mono text-muted">{formatSourceVersions(reason.sourceVersions)}</div>
  </div>
);

export const PermissionMatrixModule = ({ rows, surface }: { rows: readonly GovernancePermissionMatrixRow[]; surface: GovernanceSurface }) => (
  <SectionCard title={surface === "owner" ? "Roles and permissions" : "Active permissions"} description="Columns remain distinct: canonical, role potential, owner allowed, tenant enabled, effective and first denial reason with source versions.">
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm" data-governance-permission-matrix="true">
        <thead><tr>{["Permission", "Canonical", "Role potential", "Owner allowed", "Tenant enabled", "Effective", "Reason"].map((header) => <th key={header} className="px-3 py-2 font-semibold text-muted-strong">{header}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => <tr key={row.permission} data-reason-code={row.reason.code}>
            <td className="px-3 py-2 font-medium text-text">{row.permission}</td>
            <td className="px-3 py-2"><BooleanCell value={row.canonical} /></td>
            <td className="px-3 py-2"><BooleanCell value={row.reason.code === "not_canonical" ? null : row.rolePotential} /></td>
            <td className="px-3 py-2"><BooleanCell value={row.reason.code === "not_canonical" ? null : row.ownerAllowed} /></td>
            <td className="px-3 py-2"><BooleanCell value={row.tenantEnabled} /></td>
            <td className="px-3 py-2"><BooleanCell value={row.effective} /></td>
            <td className="px-3 py-2 text-muted-strong"><ReasonCell reason={row.reason} /></td>
          </tr>)}
        </tbody>
      </table>
    </div>
    {rows.length === 0 ? <p className="text-sm text-muted-strong">No governance matrix rows were returned by the aggregate read model.</p> : null}
  </SectionCard>
);
