import { EmptyState, SectionCard, StatusPill } from "../../../../shared/ui";
import type { GovernanceAliasNavigationPolicy } from "../../contracts";

const ownerManagedCopy = "This organization can view these settings, but only an owner can change them.";

export const AliasesNavigationModule = ({ policy }: { policy: GovernanceAliasNavigationPolicy }) => (
  <>
    <div className="civitas-grid-2">
      <SectionCard title="Aliases" description="Review display-name preferences for this organization.">
        <StatusPill status={policy.aliasesTenantEditable ? "success" : "neutral"}>{policy.aliasesTenantEditable ? "Organization editable" : "Owner managed"}</StatusPill>
        {!policy.aliasesTenantEditable ? <p className="mt-3 text-sm text-muted-strong">{ownerManagedCopy}</p> : null}
      </SectionCard>
      <SectionCard title="Navigation preferences" description="Preview allowed navigation preferences without changing authorization.">
        <StatusPill status={policy.navigationTenantEditable ? "success" : "neutral"}>{policy.navigationTenantEditable ? "Organization editable" : "Owner managed"}</StatusPill>
        {!policy.navigationTenantEditable ? <p className="mt-3 text-sm text-muted-strong">{ownerManagedCopy}</p> : null}
      </SectionCard>
    </div>
    <SectionCard title="Navigation preview" description="Preferences only affect presentation; access continues to be decided by authorization.">
      {policy.visualPreferences.length ? <div className="space-y-2">{policy.visualPreferences.map((preference) => <div key={preference.screenId} className="flex items-center justify-between rounded-control border border-border px-3 py-2 text-sm"><span className="text-text">{preference.screenId}</span><StatusPill status={preference.locked ? "neutral" : preference.hidden ? "warning" : "success"}>{preference.locked ? "Locked" : preference.hidden ? "Hidden" : `Order ${preference.order ?? "default"}`}</StatusPill></div>)}</div> : <EmptyState message="No navigation preferences"><p className="text-sm text-muted-strong">No visual navigation preferences were returned for this organization.</p></EmptyState>}
    </SectionCard>
  </>
);
