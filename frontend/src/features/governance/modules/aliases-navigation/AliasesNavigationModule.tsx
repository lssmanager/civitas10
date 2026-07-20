import { useMemo, useState } from "react";
import { DataTable, EmptyState, FilterBar, SectionCard, StatusPill, type DataTableColumn } from "../../../../shared/ui";
import type { GovernanceAliasNavigationPolicy, GovernanceSurface } from "../../contracts";

type AliasRow = NonNullable<GovernanceAliasNavigationPolicy["aliases"]>[number];

const ownerAuditCopy = "Owner can audit tenant-facing role labels here. Default-label management remains unavailable until the Owner alias policy endpoint is approved.";
const tenantUnavailableCopy = "Alias edits are display-only and tenant-scoped, but the persisted alias write endpoint from #125 is not mounted yet. The preview below does not mutate RBAC, PBAC, ABAC, Logto mappings or route eligibility.";
const normalize = (value: string) => value.trim().toLowerCase();

const aliasStatus = (alias: AliasRow, surface: GovernanceSurface) => {
  if (surface === "owner") return "Audit only";
  return alias.editableBy === "tenant" ? "Write unavailable" : "Owner managed";
};

const aliasColumns = (drafts: Record<string, string>, surface: GovernanceSurface): DataTableColumn<AliasRow>[] => [
  { key: "alias", header: "Role label", render: (alias) => <div><strong>{drafts[alias.roleId] || alias.displayName}</strong><p className="text-xs text-muted">Default: {alias.defaultLabel ?? alias.displayName}</p></div> },
  { key: "canonical", header: "Canonical ID", render: (alias) => <span className="text-xs text-muted" aria-label={`Canonical role ID ${alias.canonicalKey}`}>{alias.canonicalKey}</span> },
  { key: "description", header: "Description", render: (alias) => alias.description ?? "Display label only; no authorization effect." },
  { key: "status", header: "Status", render: (alias) => <StatusPill status={alias.editableBy === "tenant" && surface === "tenant" ? "warning" : "neutral"}>{aliasStatus(alias, surface)}</StatusPill> },
  { key: "changed", header: "Last changed", render: (alias) => <span className="text-xs text-muted">{alias.lastChangedAt ?? alias.updatedAt ?? "No audit event returned"}</span> },
];

export const AliasesNavigationModule = ({ policy, surface = "owner" }: { policy: GovernanceAliasNavigationPolicy; surface?: GovernanceSurface }) => {
  const [filter, setFilter] = useState("");
  const [family, setFamily] = useState("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const aliases = useMemo(() => policy.aliases ?? [], [policy.aliases]);
  const selectedAlias = aliases.find((alias) => alias.roleId === selectedRoleId) ?? aliases[0];
  const filteredAliases = useMemo(() => aliases.filter((alias) => {
    const query = normalize(filter);
    const matchesQuery = !query || normalize(`${alias.displayName} ${alias.canonicalKey} ${alias.description ?? ""}`).includes(query);
    const matchesFamily = family === "all" || alias.canonicalKey.includes(family);
    return matchesQuery && matchesFamily;
  }), [aliases, family, filter]);
  const draftValue = selectedAlias ? drafts[selectedAlias.roleId] ?? selectedAlias.displayName : "";
  const validation = draftValue.trim().length < 3 ? "Alias must contain at least 3 visible characters." : draftValue.length > 80 ? "Alias must be 80 characters or fewer." : null;
  const canPreview = Boolean(selectedAlias && !validation);

  return (
    <>
      <SectionCard title="Role names" description="Tenant-facing aliases are presentation metadata for canonical roles. They never change role IDs, permissions, scopes, Logto mappings or route eligibility.">
        <div className="civitas-workspace-stack">
          <div className="civitas-action-bar">
            <StatusPill status={policy.aliasesTenantEditable ? "warning" : "neutral"}>{policy.aliasesTenantEditable ? "Tenant alias contract advertised" : "Read-only"}</StatusPill>
            <StatusPill status="neutral">Version {policy.version ?? "unversioned"}</StatusPill>
          </div>
          <p className="text-sm text-muted-strong">{surface === "owner" ? ownerAuditCopy : tenantUnavailableCopy}</p>
          <FilterBar searchLabel="Search role labels" searchValue={filter} onSearchChange={setFilter} onReset={() => { setFilter(""); setFamily("all"); }}>
            <label className="civitas-form-field">
              <span className="civitas-form-field-label">Role family</span>
              <select className="civitas-field" value={family} onChange={(event) => setFamily(event.target.value)}>
                <option value="all">All role families</option>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="parent">Parent</option>
                <option value="group">Group</option>
              </select>
            </label>
          </FilterBar>
        </div>
      </SectionCard>
      <div className="civitas-grid-2">
        <SectionCard title="Canonical role labels" description="Alias is primary for users; canonical ID remains visible for support, diagnostics and assistive technology.">
          <DataTable columns={aliasColumns(drafts, surface)} data={[...filteredAliases]} getKey={(alias) => alias.roleId} emptyState={<EmptyState message="No role aliases"><p className="text-sm text-muted-strong">The aliases contract did not return role labels matching this filter.</p></EmptyState>} />
        </SectionCard>
        <SectionCard title="Alias edit preview" description="Preview validation and conflict states without mutating policy until the backend alias endpoint is mounted.">
          {selectedAlias ? <div className="civitas-workspace-stack">
            <label className="civitas-form-field">
              <span className="civitas-form-field-label">Canonical role</span>
              <select className="civitas-field" value={selectedAlias.roleId} onChange={(event) => setSelectedRoleId(event.target.value)}>
                {aliases.map((alias) => <option key={alias.roleId} value={alias.roleId}>{alias.displayName} — {alias.canonicalKey}</option>)}
              </select>
            </label>
            <label className="civitas-form-field">
              <span className="civitas-form-field-label">Tenant alias preview</span>
              <input className="civitas-field" value={draftValue} maxLength={80} onChange={(event) => setDrafts((current) => ({ ...current, [selectedAlias.roleId]: event.target.value }))} aria-describedby="role-alias-validation role-alias-canonical" />
            </label>
            <p id="role-alias-canonical" className="text-xs text-muted">Immutable canonical ID: {selectedAlias.canonicalKey}. Current default: {selectedAlias.defaultLabel ?? selectedAlias.displayName}.</p>
            <p id="role-alias-validation" className={validation ? "text-sm text-danger" : "text-sm text-muted-strong"}>{validation ?? "Alias preview is valid. Saving is unavailable until the #125 alias write contract is mounted with version/audit support."}</p>
            <div className="civitas-card civitas-pad-tight" aria-live="polite">
              <p className="text-sm text-muted-strong">Preview: <strong>{canPreview ? draftValue.trim() : selectedAlias.displayName}</strong> remains bound to <span className="text-xs text-muted">{selectedAlias.canonicalKey}</span>.</p>
            </div>
            <div className="civitas-action-bar">
              <button type="button" className="civitas-secondary-button" onClick={() => setDrafts((current) => ({ ...current, [selectedAlias.roleId]: selectedAlias.defaultLabel ?? selectedAlias.displayName }))} disabled={!policy.aliasesTenantEditable}>Reset preview to default</button>
              <button type="button" className="civitas-primary-button" disabled title="Alias write endpoint unavailable">Save alias</button>
            </div>
          </div> : <EmptyState message="No alias selected"><p className="text-sm text-muted-strong">Select a canonical role alias to preview display-only validation.</p></EmptyState>}
        </SectionCard>
      </div>
    </>
  );
};
