import { useMemo, useState } from "react";
import { EmptyState, FilterBar, PermissionGroupAccordion, RoleSelector, SectionCard, StatusPill, type PermissionToggleRow } from "../../../../shared/ui";
import type { GovernancePermissionMatrixRow, GovernanceRoleSummary, GovernanceSurface, GovernanceVersionSummary, PermissionMatrixReason } from "../../contracts";

import { formatSourceVersions, reasonLabel } from "./reason-format";

type PendingChange = { permission: string; enabled: boolean };

type PermissionMutationInput = {
  roleId: string;
  expectedPolicyVersion?: string;
  changes: PendingChange[];
  reason: string;
};

const domainLabel = (permission: string) => permission.split(".")[0]?.toUpperCase() || "OTHER";
const permissionLabel = (permission: string) => permission.replace(/\./g, " · ");
const permissionDescription = (row: GovernancePermissionMatrixRow, surface: GovernanceSurface) => `${surface === "owner" ? "Owner Ceiling" : "Tenant Activation"} for ${row.roleKey || row.roleId || "selected role"}. ${reasonLabel(row.reason.code)}.`;
const rowEnabled = (row: GovernancePermissionMatrixRow, surface: GovernanceSurface) => surface === "owner" ? row.ownerAllowed === true : row.tenantEnabled === true;
const rowEligible = (row: GovernancePermissionMatrixRow, surface: GovernanceSurface) => {
  if (!row.canonical || row.rolePotential !== true) return false;
  if (surface === "tenant" && row.ownerAllowed !== true) return false;
  if (row.reason.code === "owning_operation_not_mounted") return false;
  return true;
};
const rowReason = (row: GovernancePermissionMatrixRow, surface: GovernanceSurface) => {
  if (!row.canonical) return "permission_missing";
  if (row.rolePotential !== true) return "role_permission_missing";
  if (surface === "tenant" && row.ownerAllowed !== true) return "owner_ceiling_denied";
  return row.reason.code;
};

const SourceVersion = ({ reason }: { reason: PermissionMatrixReason }) => <span className="text-xs text-muted">{formatSourceVersions(reason.sourceVersions)}</span>;

export const PermissionMatrixModule = ({
  organizationId,
  rows,
  roles = [],
  surface,
  versions,
  onSaveOwnerCeilings,
  onSaveTenantActivations,
}: {
  organizationId: string;
  rows: readonly GovernancePermissionMatrixRow[];
  roles?: readonly GovernanceRoleSummary[];
  surface: GovernanceSurface;
  versions?: GovernanceVersionSummary;
  onSaveOwnerCeilings?: (input: PermissionMutationInput) => Promise<unknown>;
  onSaveTenantActivations?: (input: PermissionMutationInput) => Promise<unknown>;
}) => {
  const roleOptions = useMemo(() => {
    const byId = new Map<string, GovernanceRoleSummary>();
    for (const role of roles) byId.set(role.id, role);
    for (const row of rows) if (row.roleId && !byId.has(row.roleId)) byId.set(row.roleId, { id: row.roleId, canonicalKey: row.roleKey || row.roleId, displayName: row.roleKey || row.roleId, assignedMemberCount: 0, potentialPermissions: [], ceilingCoverage: 0 });
    return [...byId.values()].map((role) => ({ canonicalRoleId: role.id, alias: role.displayName, status: role.canonicalKey }));
  }, [roles, rows]);
  const readUrlState = () => new URLSearchParams(globalThis.location?.search || "");
  const writeUrlState = (updates: { role?: string; filter?: string }) => {
    const params = readUrlState();
    if (updates.role !== undefined) {
      if (updates.role) params.set("role", updates.role);
      else params.delete("role");
    }
    if (updates.filter !== undefined) {
      if (updates.filter) params.set("filter", updates.filter);
      else params.delete("filter");
    }
    const query = params.toString();
    globalThis.history?.replaceState(null, "", `${globalThis.location?.pathname || ""}${query ? `?${query}` : ""}`);
  };
  const [selectedRoleId, setSelectedRoleId] = useState(() => readUrlState().get("role") || roleOptions[0]?.canonicalRoleId || "");
  const [filter, setFilter] = useState(() => readUrlState().get("filter") || "");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<Record<string, PendingChange>>({});
  const [feedback, setFeedback] = useState<{ state: "idle" | "saving" | "saved" | "error"; message?: string }>({ state: "idle" });
  const effectiveRoleId = selectedRoleId || roleOptions[0]?.canonicalRoleId || "";
  const selectedRows = rows.filter((row) => row.roleId === effectiveRoleId && (!filter || row.permission.toLowerCase().includes(filter.toLowerCase()) || String(row.roleKey || "").toLowerCase().includes(filter.toLowerCase())));
  const pendingList = Object.values(pending);
  const grouped = useMemo(() => selectedRows.reduce((groups, row) => {
    const domain = domainLabel(row.permission);
    const override = pending[row.permission]?.enabled;
    const currentEnabled = override ?? rowEnabled(row, surface);
    const eligible = rowEligible(row, surface);
    const item: PermissionToggleRow = { permissionId: row.permission, label: permissionLabel(row.permission), checked: currentEnabled, disabled: !eligible, reason: rowReason(row, surface) };
    const existing = groups.get(domain) || [];
    existing.push({ item, row, eligible });
    groups.set(domain, existing);
    return groups;
  }, new Map<string, Array<{ item: PermissionToggleRow; row: GovernancePermissionMatrixRow; eligible: boolean }>>()), [pending, selectedRows, surface]);

  const togglePermission = (permission: string, enabled: boolean) => setPending((current) => ({ ...current, [permission]: { permission, enabled } }));
  const toggleGroup = (items: Array<{ item: PermissionToggleRow; eligible: boolean }>, enabled: boolean) => setPending((current) => {
    const next = { ...current };
    for (const { item, eligible } of items) if (eligible) next[item.permissionId] = { permission: item.permissionId, enabled };
    return next;
  });
  const save = async () => {
    const writer = surface === "owner" ? onSaveOwnerCeilings : onSaveTenantActivations;
    if (!writer || !effectiveRoleId || pendingList.length === 0) return;
    setFeedback({ state: "saving", message: "Saving permission policy changes…" });
    try {
      await writer({ roleId: effectiveRoleId, expectedPolicyVersion: versions?.policyVersion, changes: pendingList, reason: surface === "owner" ? "owner_ceiling_update" : "tenant_activation_update" });
      setPending({});
      setFeedback({ state: "saved", message: "Policy changes saved. Refresh the read model to see the new policy version." });
    } catch (error) {
      setFeedback({ state: "error", message: error instanceof Error ? error.message : "Policy update failed. Check version and retry." });
    }
  };

  if (!roleOptions.length) return <SectionCard title="Role permissions" description="Select one canonical role to manage its permissions."><EmptyState message="No roles available"><p className="text-sm text-muted-strong">The persisted governance policy read model did not return canonical roles.</p></EmptyState></SectionCard>;

  return (
    <SectionCard title={surface === "owner" ? "Owner Ceiling policy" : "Tenant Activation policy"} description={surface === "owner" ? "Select one canonical role and edit only Owner Ceiling decisions." : "Select one canonical role and edit only Tenant Activations allowed by Owner Ceiling."}>
      <div className="civitas-workspace-stack">
        <RoleSelector id="governance-role-selector" label="Canonical role" value={effectiveRoleId} roles={roleOptions} onChange={(roleId) => { setSelectedRoleId(roleId); setPending({}); writeUrlState({ role: roleId }); }} />
        <FilterBar searchLabel="Search permissions" searchValue={filter} onSearchChange={(value) => { setFilter(value); writeUrlState({ filter: value }); }} onReset={() => { setFilter(""); setPending({}); writeUrlState({ filter: "" }); }}>
          <StatusPill status={pendingList.length ? "warning" : "neutral"}>{pendingList.length} pending</StatusPill>
          <StatusPill status="neutral">{organizationId}</StatusPill>
        </FilterBar>
        {[...grouped.entries()].map(([domain, items]) => <PermissionGroupAccordion key={domain} domain={domain} expanded={expanded[domain] ?? true} rows={items.map(({ item }) => item)} onExpandedChange={(isExpanded) => setExpanded((current) => ({ ...current, [domain]: isExpanded }))} onTogglePermission={togglePermission} onToggleGroup={(enabled) => toggleGroup(items, enabled)} />)}
        {selectedRows.map((row) => <p key={`${row.permission}:detail`} className="text-xs text-muted"><strong>{permissionLabel(row.permission)}</strong> — {permissionDescription(row, surface)} <SourceVersion reason={row.reason} /></p>)}
        <div className="civitas-card civitas-pad-tight" aria-live="polite">
          <p className="text-sm text-muted-strong">Change summary: {pendingList.length ? pendingList.map((change) => `${change.permission} → ${change.enabled ? "enabled" : "disabled"}`).join(", ") : "No pending mutations."}</p>
          {feedback.message ? <p className={feedback.state === "error" ? "text-sm text-danger" : "text-sm text-muted-strong"}>{feedback.message}</p> : null}
          <div className="civitas-action-bar"><button type="button" className="civitas-secondary-button" onClick={() => setPending({})} disabled={!pendingList.length || feedback.state === "saving"}>Rollback</button><button type="button" className="civitas-primary-button" onClick={() => void save()} disabled={!pendingList.length || feedback.state === "saving"}>{feedback.state === "saving" ? "Saving…" : "Save batch"}</button></div>
        </div>
      </div>
    </SectionCard>
  );
};
