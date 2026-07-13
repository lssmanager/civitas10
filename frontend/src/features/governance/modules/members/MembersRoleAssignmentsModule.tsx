import { SectionCard } from "../../../../shared/ui";

export const MembersRoleAssignmentsModule = () => (
  <SectionCard title="Members and role assignments" description="Tenant-owned module placeholder: assignments must stay inside delegation rules and cannot mutate Logto role templates.">
    <p className="text-sm text-slate-600">Member role assignment data is supplied by the tenant governance read model. No owner ceiling or Logto template write is performed by this surface.</p>
  </SectionCard>
);
