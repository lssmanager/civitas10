import { useMemo } from "react";
import { EmptyState, SectionCard } from "../../../../shared/ui";
import type { GovernanceAliasNavigationPolicy, GovernanceRoleSummary, GovernanceSurface } from "../../contracts";

type AliasRow = NonNullable<GovernanceAliasNavigationPolicy["aliases"]>[number];

type RoleNameRow = {
  roleId: string;
  canonicalKey: string;
  defaultLabel: string;
  alias: string;
  assignedMemberCount: number;
  orphaned?: false;
};

const aliasValue = (row: RoleNameRow) => row.alias || row.defaultLabel || row.canonicalKey;
const isOrganizationRole = (role: GovernanceRoleSummary) => role.canonicalKey !== "owner_global" && role.canonicalKey.startsWith("organization_");

export const AliasesNavigationModule = ({ roles = [], policy, surface }: { roles?: readonly GovernanceRoleSummary[]; policy: GovernanceAliasNavigationPolicy; surface?: GovernanceSurface }) => {
  const aliasesByRoleId = useMemo(() => new Map<string, AliasRow>((policy.aliases ?? []).map((alias) => [alias.roleId, alias])), [policy.aliases]);
  const organizationRoles = useMemo(() => roles.filter(isOrganizationRole), [roles]);
  const rows = useMemo<RoleNameRow[]>(() => organizationRoles.map((role) => {
    const alias = aliasesByRoleId.get(role.id);
    return {
      roleId: role.id,
      canonicalKey: role.canonicalKey,
      defaultLabel: role.displayName,
      alias: alias?.displayName ?? role.displayName,
      assignedMemberCount: role.assignedMemberCount,
    };
  }), [aliasesByRoleId, organizationRoles]);
  const orphanAliases = useMemo(() => (policy.aliases ?? []).filter((alias) => !organizationRoles.some((role) => role.id === alias.roleId)), [organizationRoles, policy.aliases]);
  const duplicateCanonicalKeys = useMemo(() => {
    const counts = new Map<string, number>();
    for (const role of organizationRoles) counts.set(role.canonicalKey, (counts.get(role.canonicalKey) ?? 0) + 1);
    return [...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key);
  }, [organizationRoles]);
  const stale = surface && policy.version && policy.version !== "current";

  if (!rows.length) {
    return (
      <SectionCard title="Role names" description="Alias visuales para roles organizacionales canónicos de Logto (ID inmutable).">
        <EmptyState message="No organization roles returned by the governance read model">
          <p className="text-sm text-muted-strong">The backend did not return organization-scoped Logto roles for this organization. This is distinct from an empty alias override list.</p>
        </EmptyState>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Role names" description="Alias visuales para roles organizacionales canónicos de Logto (ID inmutable).">
      <div className="civitas-workspace-stack">
        {orphanAliases.length || duplicateCanonicalKeys.length || stale ? <div className="civitas-card civitas-pad-tight" role="status" aria-live="polite">
          <p className="text-sm font-semibold text-text">Role catalog diagnostics</p>
          <ul className="mt-2 grid gap-1 text-sm text-muted-strong">
            {orphanAliases.map((alias) => <li key={alias.roleId}>Alias references missing Logto role: <code>{alias.roleId}</code>.</li>)}
            {duplicateCanonicalKeys.map((key) => <li key={key}>Duplicate canonical role key returned by Logto: <code>{key}</code>.</li>)}
            {stale ? <li>Alias policy version is stale; refresh the governance read model before changing role labels.</li> : null}
          </ul>
        </div> : null}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                <th scope="col" className="px-3 py-2">Canonical role (Logto)</th>
                <th scope="col" className="px-3 py-2">Default label</th>
                <th scope="col" className="px-3 py-2">Visual alias</th>
                <th scope="col" className="px-3 py-2">Members</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.roleId} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-3 align-middle font-mono text-xs text-muted-strong" title={row.roleId}>{row.canonicalKey}</td>
                  <td className="px-3 py-3 align-middle text-muted-strong">{row.defaultLabel}</td>
                  <td className="px-3 py-3 align-middle">
                    <input className="civitas-field" value={aliasValue(row)} maxLength={80} readOnly aria-readonly="true" aria-label={`Visual alias for ${row.canonicalKey}`} />
                  </td>
                  <td className="px-3 py-3 align-middle text-muted-strong">{row.assignedMemberCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="civitas-action-bar">
          <p className="text-sm text-muted-strong">Alias editing is read-only until the audited alias write API is mounted. No frontend Logto Management API calls are made.</p>
          <button type="button" className="civitas-primary-button" disabled title="Alias write API is not mounted yet.">Save aliases</button>
        </div>
      </div>
    </SectionCard>
  );
};
