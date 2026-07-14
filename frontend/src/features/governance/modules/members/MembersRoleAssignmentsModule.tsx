import { EmptyState, SectionCard } from "../../../../shared/ui";

export const MembersRoleAssignmentsModule = () => (
  <SectionCard title="Members" description="Review member assignments when the tenant governance read model returns them.">
    <EmptyState message="Member assignments are not available in this snapshot"><p className="text-sm text-muted-strong">No member assignment data was returned for this organization.</p></EmptyState>
  </SectionCard>
);
