import { useId } from "react";

export type PermissionToggleRow = {
  permissionId: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  loading?: boolean;
  reason?: string;
};

export const PermissionGroupAccordion = ({
  domain,
  rows,
  expanded,
  activeCount,
  totalCount,
  roleLabel,
  onExpandedChange,
  onTogglePermission,
  onToggleGroup,
  disabled = false,
}: {
  domain: string;
  rows: PermissionToggleRow[];
  expanded: boolean;
  activeCount: number;
  totalCount: number;
  roleLabel: string;
  onExpandedChange: (expanded: boolean) => void;
  onTogglePermission: (permissionId: string, checked: boolean) => void;
  onToggleGroup: (checked: boolean) => void;
  disabled?: boolean;
}) => {
  const panelId = useId();
  const groupToggleActive = activeCount > 0;
  const nextGroupState = activeCount === 0;
  return (
    <section className="civitas-card civitas-card-flush" data-civitas-primitive="permission-group-accordion">
      <div className="civitas-card-header">
        <button type="button" className="civitas-button civitas-permission-group-summary" aria-expanded={expanded} aria-controls={panelId} onClick={() => onExpandedChange(!expanded)}>
          <span aria-hidden="true">{expanded ? "⌃" : "⌄"}</span>
          <span>{domain}</span>
        </button>
        <div className="inline-flex items-center gap-3 text-xs font-semibold text-muted-strong">
          <span aria-label={`${activeCount} of ${totalCount} ${domain} permissions enabled`}>{activeCount}/{totalCount}</span>
          <label className="inline-flex items-center gap-2" title={`${groupToggleActive ? "Disable" : "Enable"} all editable ${domain} permissions for ${roleLabel}`}>
            <input type="checkbox" aria-label={`${groupToggleActive ? "Disable" : "Enable"} all editable ${domain} permissions for ${roleLabel}`} checked={groupToggleActive} disabled={disabled || totalCount === 0} onChange={() => onToggleGroup(nextGroupState)} />
          </label>
        </div>
      </div>
      {expanded ? <div id={panelId} className="civitas-list-stack">
        <div className="hidden md:grid civitas-list-row text-xs font-semibold uppercase tracking-wide text-muted" style={{ gridTemplateColumns: "minmax(12rem,1fr) minmax(16rem,2fr) auto" }}>
          <span>Permission name</span><span>Permission/capability description</span><span>Toggle</span>
        </div>
        {rows.map((row) => <div key={row.permissionId} className="civitas-list-row md:grid md:items-center md:gap-4" style={{ gridTemplateColumns: "minmax(12rem,1fr) minmax(16rem,2fr) auto" }}>
          <span className="min-w-0"><span className="block truncate font-semibold" title={row.permissionId}>{row.label}</span>{row.reason ? <span className="block text-xs text-muted" title={`${row.permissionId} · ${row.reason}`}>{row.reason}</span> : null}</span>
          <span className="text-sm text-muted-strong">{row.description ?? ""}</span>
          <label className="inline-flex items-center gap-2 justify-self-end">
            <span className="sr-only">Toggle {row.label} for {roleLabel}</span>
            <input type="checkbox" checked={row.checked} disabled={disabled || row.disabled || row.loading} onChange={(event) => onTogglePermission(row.permissionId, event.target.checked)} />
          </label>
        </div>)}
      </div> : null}
    </section>
  );
};
