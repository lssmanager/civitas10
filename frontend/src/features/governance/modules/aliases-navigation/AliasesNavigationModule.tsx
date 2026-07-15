import { DataTable, EmptyState, SectionCard, StatusPill, type DataTableColumn } from "../../../../shared/ui";
import type { GovernanceAliasNavigationPolicy } from "../../contracts";

const ownerManagedCopy = "This organization can view these settings, but only an owner can change them.";
type AliasRow = NonNullable<GovernanceAliasNavigationPolicy["aliases"]>[number];
type PreferenceRow = GovernanceAliasNavigationPolicy["visualPreferences"][number];

const aliasColumns: DataTableColumn<AliasRow>[] = [
  { key: "canonical", header: "Canonical role", render: (alias) => <span className="font-medium text-text">{alias.canonicalKey}</span> },
  { key: "display", header: "Display alias", render: (alias) => alias.displayName },
  { key: "owner", header: "Edit owner", render: (alias) => <StatusPill status={alias.editableBy === "tenant" ? "success" : "neutral"}>{alias.editableBy === "tenant" ? "Tenant editable" : "Owner controlled"}</StatusPill> },
];

const preferenceColumns: DataTableColumn<PreferenceRow>[] = [
  { key: "screen", header: "Canonical screen", render: (preference) => <span className="font-medium text-text">{preference.canonicalLabel || preference.screenId}</span> },
  { key: "id", header: "Screen ID", render: (preference) => <span className="text-xs text-muted">{preference.screenId}</span> },
  { key: "state", header: "Preference", render: (preference) => <StatusPill status={preference.locked ? "neutral" : preference.hidden ? "warning" : "success"}>{preference.locked ? "Locked" : preference.hidden ? "Hidden" : `Order ${preference.order ?? "default"}`}</StatusPill> },
  { key: "authority", header: "Authorization effect", render: (preference) => preference.authorizationEffect === "presentation_only" ? "Presentation only" : "No authorization change" },
];

export const AliasesNavigationModule = ({ policy }: { policy: GovernanceAliasNavigationPolicy }) => (
  <>
    <div className="civitas-grid-2">
      <SectionCard title="Aliases" description="Canonical roles stay stable; aliases only change organization-facing labels.">
        <StatusPill status={policy.aliasesTenantEditable ? "success" : "neutral"}>{policy.aliasesTenantEditable ? "Organization editable" : "Owner managed"}</StatusPill>
        {!policy.aliasesTenantEditable ? <p className="mt-3 text-sm text-muted-strong">{ownerManagedCopy}</p> : null}
      </SectionCard>
      <SectionCard title="Navigation preferences" description="Registered menu preferences may hide or reorder eligible items, but never authorize a route.">
        <StatusPill status={policy.navigationTenantEditable ? "success" : "neutral"}>{policy.navigationTenantEditable ? "Organization editable" : "Owner managed"}</StatusPill>
        <p className="mt-3 text-sm text-muted-strong">Version {policy.version ?? "unversioned"}. Hidden-menu/direct-URL access still uses server authorization.</p>
      </SectionCard>
    </div>
    <SectionCard title="Role aliases" description="Display canonical identity beside tenant-facing labels.">
      <DataTable columns={aliasColumns} data={policy.aliases ?? []} getKey={(alias) => alias.roleId} emptyState={<EmptyState message="No aliases"><p className="text-sm text-muted-strong">No role alias preferences were returned for this organization.</p></EmptyState>} />
    </SectionCard>
    <SectionCard title="Navigation preview" description="Preferences only affect presentation; access continues to be decided by authorization.">
      <DataTable columns={preferenceColumns} data={[...policy.visualPreferences]} getKey={(preference) => preference.screenId} emptyState={<EmptyState message="No navigation preferences"><p className="text-sm text-muted-strong">No visual navigation preferences were returned for this organization.</p></EmptyState>} />
    </SectionCard>
  </>
);
