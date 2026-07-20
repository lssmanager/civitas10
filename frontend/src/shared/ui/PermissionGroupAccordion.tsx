import { useId } from "react";
import { StatusPill } from "./StatusPill";

export type PermissionToggleRow = {
  permissionId: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  loading?: boolean;
  reason?: string;
};

export const PermissionGroupAccordion = ({
  domain,
  rows,
  expanded,
  onExpandedChange,
  onTogglePermission,
  onToggleGroup,
  disabled = false,
}: {
  domain: string;
  rows: PermissionToggleRow[];
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onTogglePermission: (permissionId: string, checked: boolean) => void;
  onToggleGroup: (checked: boolean) => void;
  disabled?: boolean;
}) => {
  const panelId = useId();
  const enabledCount = rows.filter((row) => row.checked).length;
  const checked = rows.length > 0 && enabledCount === rows.length;
  const mixed = enabledCount > 0 && enabledCount < rows.length;
  return (
    <section className="civitas-card civitas-card-flush" data-civitas-primitive="permission-group-accordion">
      <div className="civitas-card-header">
        <button type="button" className="civitas-button" aria-expanded={expanded} aria-controls={panelId} onClick={() => onExpandedChange(!expanded)}>
          <span>{domain}</span>
          <span aria-hidden="true">{expanded ? "⌃" : "⌄"}</span>
        </button>
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-muted-strong" title={`Select all ${domain} permissions`}>
          <input type="checkbox" aria-label={`Select all ${domain} permissions`} checked={checked} ref={(node) => { if (node) node.indeterminate = mixed; }} disabled={disabled} onChange={(event) => onToggleGroup(event.target.checked)} />
          <StatusPill status={mixed ? "warning" : checked ? "success" : "neutral"} noDot>{enabledCount}/{rows.length}</StatusPill>
        </label>
      </div>
      {expanded ? <div id={panelId} className="civitas-list-stack">
        {rows.map((row) => <label key={row.permissionId} className="civitas-list-row">
          <input type="checkbox" checked={row.checked} disabled={disabled || row.disabled || row.loading} onChange={(event) => onTogglePermission(row.permissionId, event.target.checked)} />
          <span className="min-w-0 flex-1"><span className="block truncate" title={row.permissionId}>{row.label}</span>{row.reason ? <span className="block text-xs text-muted" title={`${row.permissionId} · ${row.reason}`}>{row.reason}</span> : null}</span>
        </label>)}
      </div> : null}
    </section>
  );
};
