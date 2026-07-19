import { AlertStrip, DataTable, EmptyState, SectionCard, StatusPill, type DataTableColumn } from "../../../../shared/ui";

export type LmsGroupSummary = { id: string; displayName: string; summary?: string; courseCount?: number; memberCount?: number; authorization?: { reasonCode?: string } };
export type LmsGroupDetail = LmsGroupSummary & { courseOfferings?: Array<{ id: string; displayName: string; subjectKey?: string }>; members?: Array<{ id: string; displayName: string; memberType: "student" | "teacher" | "support" }> };
export type LmsGroupsState = { state: "loading" | "ready" | "empty" | "denied" | "error"; reasonCode?: string; groups: readonly LmsGroupSummary[]; selectedGroup?: LmsGroupDetail };

const columns: DataTableColumn<LmsGroupSummary>[] = [
  { key: "name", header: "Group", render: (group) => <span className="font-medium text-text">{group.displayName}</span> },
  { key: "summary", header: "Summary", render: (group) => group.summary || "No summary" },
  { key: "members", header: "Members", render: (group) => String(group.memberCount ?? 0) },
  { key: "courses", header: "Courses", render: (group) => String(group.courseCount ?? 0) },
  { key: "access", header: "Access", render: () => <StatusPill status="success">Read only</StatusPill> },
];

export const LmsGroupsModule = ({ model }: { model: LmsGroupsState }) => {
  if (model.state === "loading") return <SectionCard title="Groups"><p className="text-sm text-muted-strong" aria-live="polite">Loading authorized groups…</p></SectionCard>;
  if (model.state === "denied") return <SectionCard title="Groups"><AlertStrip variant="warning" title="Access denied">You do not have access to this group. Reason: {model.reasonCode || "resource_forbidden"}.</AlertStrip></SectionCard>;
  if (model.state === "error") return <SectionCard title="Groups"><AlertStrip variant="danger" title="Groups unavailable">We could not load authorized groups. Try again later.</AlertStrip></SectionCard>;
  return <SectionCard title="Groups" description="Solo ves grupos donde eres líder. This view is read-only and never grants grade editing or permission management.">
    <DataTable columns={columns} data={[...model.groups]} getKey={(group) => group.id} emptyState={<EmptyState message="No led groups"><p className="text-sm text-muted-strong">No groups were returned by the authorized endpoint for your current scope.</p></EmptyState>} />
    {model.selectedGroup ? <section aria-labelledby="selected-group-title" className="mt-4 rounded-lg border border-border p-4">
      <h3 id="selected-group-title" className="text-base font-semibold text-text">{model.selectedGroup.displayName}</h3>
      <p className="text-sm text-muted-strong">Composition, teachers and course offerings are limited to the selected authorized group.</p>
      <h4 className="mt-3 text-sm font-semibold text-text">Course offerings</h4>
      <ul>{(model.selectedGroup.courseOfferings || []).map((course) => <li key={course.id}>{course.displayName}</li>)}</ul>
      <h4 className="mt-3 text-sm font-semibold text-text">Members</h4>
      <ul>{(model.selectedGroup.members || []).map((member) => <li key={member.id}>{member.displayName} — {member.memberType}</li>)}</ul>
    </section> : null}
  </SectionCard>;
};
