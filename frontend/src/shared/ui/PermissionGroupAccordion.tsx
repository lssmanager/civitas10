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
          <span>{domain}</span><StatusPill status={mixed ? "warning" : checked ? "success" : "neutral"} noDot>{enabledCount}/{rows.length}</StatusPill>
        </button>
        <label className="civitas-form-field-label">
          <input type="checkbox" checked={checked} ref={(node) => { if (node) node.indeterminate = mixed; }} disabled={disabled} onChange={(event) => onToggleGroup(event.target.checked)} />
          Toggle group
        </label>
      </div>
      {expanded ? <div id={panelId} className="civitas-list-stack">
        {rows.map((row) => <label key={row.permissionId} className="civitas-list-row">
          <input type="checkbox" checked={row.checked} disabled={disabled || row.disabled || row.loading} onChange={(event) => onTogglePermission(row.permissionId, event.target.checked)} />
          <span className="min-w-0 flex-1"><span className="block truncate">{row.label}</span><span className="block text-xs text-muted">{row.permissionId}{row.reason ? ` · ${row.reason}` : ""}</span></span>
        </label>)}
      </div> : null}
    </section>
  );
};
