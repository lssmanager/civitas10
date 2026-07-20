import { useMemo, useState } from "react";
import { DataTable, DecisionState, EmptyState, FilterToolbar, FormDrawer, HierarchyWorkbench, MetricCard, ResponsiveDataView, SectionCard, StatusPill, type DataTableColumn } from "../../../../shared/ui";
import type { GovernanceTaxonomyItem, GovernanceUnitItem, GovernanceSurface } from "../../contracts";

const managementLevelLabels: Record<string, string> = { organization: "Organization", strategic: "Strategic", tactical: "Tactical", coordination: "Coordination", operational: "Operational", administrative: "Administrative" };
const unitLabel = (unit?: GovernanceUnitItem) => unit?.label || unit?.stableKey || unit?.id || "Virtual organization root";
const childCount = (units: readonly GovernanceUnitItem[], unitId: string) => units.filter((unit) => unit.parentId === unitId).length;
const descendantsOf = (units: readonly GovernanceUnitItem[], unitId: string): Set<string> => {
  const descendants = new Set<string>();
  const visit = (id: string) => units.filter((unit) => unit.parentId === id).forEach((child) => { descendants.add(child.id); visit(child.id); });
  visit(unitId);
  return descendants;
};

const columns = (onSelect: (unitId: string) => void): DataTableColumn<GovernanceUnitItem>[] => [
  { key: "unit", header: "Organization unit", render: (unit) => <button type="button" className="text-primary-strong" onClick={() => onSelect(unit.id)}>{unitLabel(unit)}</button> },
  { key: "type", header: "Unit type", render: (unit) => unit.unitType || "Not reported" },
  { key: "parent", header: "Parent", render: (unit) => unit.parentId || "Virtual organization root" },
  { key: "level", header: "Management level", render: (unit) => <StatusPill status={unit.managementLevel === "administrative" ? "warning" : "neutral"}>{managementLevelLabels[unit.managementLevel ?? ""] ?? "Not reported"}</StatusPill> },
  { key: "status", header: "Status", render: (unit) => <StatusPill status={unit.status === "active" ? "success" : "warning"}>{unit.status}</StatusPill> },
];

export const UnitsModule = ({ units, taxonomy = [], surface = "owner" }: { units: readonly GovernanceUnitItem[]; taxonomy?: readonly GovernanceTaxonomyItem[]; surface?: GovernanceSurface }) => {
  const [selectedId, setSelectedId] = useState(units[0]?.id || "");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classificationFilter, setClassificationFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const selected = units.find((unit) => unit.id === selectedId) ?? units[0];
  const descendants = selected ? descendantsOf(units, selected.id) : new Set<string>();
  const filteredUnits = useMemo(() => units.filter((unit) => {
    const matchesQuery = !query || `${unit.label} ${unit.stableKey ?? ""} ${unit.unitType ?? ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesType = typeFilter === "all" || unit.unitType === typeFilter;
    const matchesStatus = statusFilter === "all" || unit.status === statusFilter;
    const matchesClassification = classificationFilter === "all" || unit.stableKey === classificationFilter || unit.id === classificationFilter;
    return matchesQuery && matchesType && matchesStatus && matchesClassification;
  }), [classificationFilter, query, statusFilter, typeFilter, units]);
  const unitTypes = [...new Set(units.map((unit) => unit.unitType).filter(Boolean))];
  const statuses = [...new Set(units.map((unit) => unit.status))];
  const parentOptions = units.filter((unit) => selected && unit.id !== selected.id && !descendants.has(unit.id));
  const invalidUnits = units.filter((unit) => unit.validation?.state && unit.validation.state !== "valid");
  const canvas = (
    <SectionCard title="Structure canvas" description="Canvas view renders persisted OrganizationUnit nodes and parent-child edges for one hierarchy. React Flow is not added until license, bundle and accessibility review is complete.">
      <div className="civitas-action-bar">
        <button type="button" className="civitas-secondary-button" disabled title="Zoom renderer unavailable">Zoom / fit</button>
        <button type="button" className="civitas-primary-button" onClick={() => setDrawerOpen(true)} disabled={surface === "owner"}>Create unit</button>
      </div>
      {filteredUnits.length ? <div className="civitas-workspace-stack" role="tree" aria-label="Organization unit hierarchy canvas">
        <button type="button" className="civitas-card civitas-pad-tight text-left" aria-selected={!selected} onClick={() => setSelectedId("")}>Virtual organization root <span className="text-xs text-muted">non-editable</span></button>
        {filteredUnits.map((unit) => <button key={unit.id} type="button" role="treeitem" aria-selected={selected?.id === unit.id} className="civitas-card civitas-pad-tight text-left" onClick={() => setSelectedId(unit.id)}>
          <strong>{unitLabel(unit)}</strong><p className="text-xs text-muted">{unit.unitType || "unit"} · parent {unit.parentId || "virtual root"} · children {childCount(units, unit.id)}</p>
        </button>)}
      </div> : <EmptyState message="No units match filters"><p className="text-sm text-muted-strong">No persisted organization units match the current filters.</p></EmptyState>}
    </SectionCard>
  );
  const listCards = filteredUnits.map((unit) => <SectionCard key={unit.id} title={unitLabel(unit)} description={`${unit.unitType || "unit"} · ${unit.status}`}><button type="button" className="civitas-secondary-button" onClick={() => setSelectedId(unit.id)}>Open inspector</button></SectionCard>);
  const inspector = (
    <SectionCard title={selected ? unitLabel(selected) : "Virtual organization root"} description="Inspector shows structure, classification and relationship context. It never edits RBAC, PBAC or ABAC permissions.">
      {selected ? <div className="civitas-workspace-stack">
        <div className="civitas-grid-3">
          <MetricCard label="Children" value={childCount(units, selected.id)} detail="Direct child units." />
          <MetricCard label="Descendants" value={descendants.size} detail="Excluded from parent picker to prevent cycles." />
          <MetricCard label="Relationships" value={selected.relationshipCount ?? 0} detail="Leads/manages/teaches shown as metadata only." />
        </div>
        <DecisionState kind={selected.validation?.state === "invalid" ? "denied" : selected.validation?.state === "reconciliation_required" ? "limited" : "allowed"} title="Server validation state" reasonCode={selected.validation?.reasons?.[0] || "organization_unit_validated_by_server"}><p className="text-sm text-muted-strong">Server remains authoritative for tenant, cycle, parent type and template validation in a transaction.</p></DecisionState>
        <div className="civitas-card civitas-pad-tight"><h3 className="civitas-card-title">Details</h3><p>Name: {selected.label}</p><p>Type: {selected.unitType || "Not reported"}</p><p>Management level: {managementLevelLabels[selected.managementLevel ?? ""] ?? "Not reported"}</p><p>Status: {selected.status}</p><p>Hierarchy: {selected.hierarchyKey ?? "default"}</p></div>
        <div className="civitas-card civitas-pad-tight"><h3 className="civitas-card-title">Move</h3><label className="civitas-form-field"><span className="civitas-form-field-label">Parent selector</span><select className="civitas-field" value={selected.parentId ?? ""} disabled={surface === "owner"} onChange={() => undefined}><option value="">Virtual organization root</option>{parentOptions.map((unit) => <option key={unit.id} value={unit.id}>{unitLabel(unit)}</option>)}</select></label><p className="text-sm text-muted-strong">Descendants are excluded to prevalidate cycles; saving is not available yet.</p></div>
        <div className="civitas-card civitas-pad-tight"><h3 className="civitas-card-title">People / relationships</h3><p>Responsible members are represented by tenant-scoped leads/manages/teaches relationships and shown as metadata, not graph identity.</p></div>
        <div className="civitas-card civitas-pad-tight"><h3 className="civitas-card-title">Classification</h3><p>Taxonomy tags filter and classify units; they never become hierarchy nodes or parent-child edges.</p><p className="text-xs text-muted">Available tags: {taxonomy.map((item) => item.label).join(", ") || "No taxonomy tags returned"}</p></div>
      </div> : <DecisionState kind="pending" title="Virtual root selected" reasonCode="organization_root_virtual"><p className="text-sm text-muted-strong">The organization root is virtual and non-editable. Create top-level units only through server-validated templates.</p></DecisionState>}
    </SectionCard>
  );

  return (
    <>
      <HierarchyWorkbench toolbar={<FilterToolbar searchLabel="Search units" searchValue={query} onSearchChange={setQuery} onReset={() => { setQuery(""); setTypeFilter("all"); setStatusFilter("all"); setClassificationFilter("all"); }}><label className="civitas-form-field"><span className="civitas-form-field-label">Type</span><select className="civitas-field" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">All types</option>{unitTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label><label className="civitas-form-field"><span className="civitas-form-field-label">Status</span><select className="civitas-field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label><label className="civitas-form-field"><span className="civitas-form-field-label">Classification</span><select className="civitas-field" value={classificationFilter} onChange={(event) => setClassificationFilter(event.target.value)}><option value="all">All tags</option>{taxonomy.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></FilterToolbar>} canvas={<div className="civitas-workspace-stack"><div className="civitas-grid-3"><MetricCard label="Units" value={units.length} detail="Persisted OrganizationUnit nodes." /><MetricCard label="Invalid" value={invalidUnits.length} detail="Server-reported validation issues." variant={invalidUnits.length ? "warning" : "ok"} /><MetricCard label="Mode" value={surface === "owner" ? "Read-only" : "Tenant edit"} detail="Writes require active action authorization." /></div>{canvas}<ResponsiveDataView label="Keyboard and mobile organization unit list" table={<DataTable columns={columns(setSelectedId)} data={[...filteredUnits]} getKey={(unit) => unit.id} emptyState={<EmptyState message="No organization units"><p className="text-sm text-muted-strong">The read model returned no organization units.</p></EmptyState>} />} cards={<>{listCards}</>} /></div>} inspector={inspector} />
      <FormDrawer title="Create organization unit" open={drawerOpen} onClose={() => setDrawerOpen(false)} actions={<><button type="button" className="civitas-secondary-button" onClick={() => setDrawerOpen(false)}>Cancel</button><button type="button" className="civitas-primary-button" disabled title="Organization unit changes are not available yet">Save unit</button></>}>
        <p className="text-sm text-muted-strong">Create is staged through the pattern only. Tenant writes must call the persisted organizationUnits API with expected structure version, unit type, parent, management level and server-side validation.</p>
        <label className="civitas-form-field"><span className="civitas-form-field-label">Unit name</span><input className="civitas-field" placeholder="e.g. Campus Norte" /></label>
        <label className="civitas-form-field"><span className="civitas-form-field-label">Unit type</span><select className="civitas-field"><option>Choose server-approved type</option>{unitTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
      </FormDrawer>
    </>
  );
};
