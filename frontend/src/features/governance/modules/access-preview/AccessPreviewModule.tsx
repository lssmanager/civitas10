import { useState } from "react";
import { DataTable, EmptyState, FormField, SectionCard, StatusPill, type DataTableColumn } from "../../../../shared/ui";
import type { ActionId, ScreenId } from "../../../../authorization/contracts/ids";
import type { GovernanceAccessPreview, GovernanceAccessPreviewRequest, GovernanceSurface, PermissionMatrixReason } from "../../contracts";
import { formatSourceVersions, reasonLabel } from "../permission-matrix/reason-format";

const previewVersions = (preview: GovernanceAccessPreview) => formatSourceVersions(preview.decision.sourceVersions as PermissionMatrixReason["sourceVersions"]);

const columns: DataTableColumn<GovernanceAccessPreview>[] = [
  { key: "subject", header: "Subject", render: (preview) => <span className="font-medium text-text">{preview.subjectId}</span> },
  { key: "target", header: "Target", render: (preview) => preview.actionId || preview.screenId || "Not specified" },
  { key: "decision", header: "Decision", render: (preview) => <StatusPill status={preview.decision.allowed ? "success" : "danger"}>{preview.decision.allowed ? "Allowed" : "Denied"}</StatusPill> },
  { key: "reason", header: "Reason", render: (preview) => <div><span>{reasonLabel(preview.decision.reason as PermissionMatrixReason["code"])}</span><p className="text-xs text-muted">{previewVersions(preview)}</p></div> },
];

export const AccessPreviewUnavailable = () => (
  <SectionCard title="Access preview" description="Preview what a user or role can do in this organization once the service is active.">
    <EmptyState message="Access preview is not available yet"><p className="text-sm text-muted-strong">The preview service is not active for this organization.</p></EmptyState>
  </SectionCard>
);

export const AccessPreviewModule = ({ organizationId, surface, previews, onPreview }: { organizationId: string; surface: GovernanceSurface; previews: readonly GovernanceAccessPreview[]; onPreview: (request: GovernanceAccessPreviewRequest) => Promise<GovernanceAccessPreview> }) => {
  const [subjectId, setSubjectId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [targetType, setTargetType] = useState<"action" | "screen">("action");
  const [previewResult, setPreviewResult] = useState<GovernanceAccessPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulatePreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const request: GovernanceAccessPreviewRequest = { organizationId, surface, subjectId, actionId: targetType === "action" ? targetId as ActionId : undefined, screenId: targetType === "screen" ? targetId as ScreenId : undefined };
      const result = await onPreview(request);
      setPreviewResult(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Access preview failed.");
    } finally {
      setLoading(false);
    }
  };

  const visiblePreviews = previewResult ? [previewResult, ...previews] : previews;

  return (
    <SectionCard title="Access preview" description="Simulate an authorization decision for this selected organization." actions={<StatusPill status="success">Read-only</StatusPill>}>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]" data-access-preview-flow="actor-action-simulate-explanation">
        <FormField id="governance-preview-subject" label="Actor or role"><input id="governance-preview-subject" className="civitas-input" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} placeholder="user or role id" /></FormField>
        <FormField id="governance-preview-target" label="Action or screen"><input id="governance-preview-target" className="civitas-input" value={targetId} onChange={(event) => setTargetId(event.target.value)} placeholder="permission or screen id" /></FormField>
        <FormField id="governance-preview-type" label="Type"><select id="governance-preview-type" className="civitas-input" value={targetType} onChange={(event) => setTargetType(event.target.value as "action" | "screen")}><option value="action">Action</option><option value="screen">Screen</option></select></FormField>
        <button type="button" className="civitas-primary-button self-end" disabled={!subjectId || !targetId || loading} onClick={() => void simulatePreview()}>{loading ? "Previewing..." : "Preview access"}</button>
      </div>
      {error ? <p className="mt-3 text-sm text-danger-strong">{error}</p> : null}
      <DataTable columns={columns} data={[...visiblePreviews]} getKey={(preview, index) => `${preview.subjectId}-${preview.actionId || preview.screenId}-${index}`} emptyState={<EmptyState message="No access previews"><p className="text-sm text-muted-strong">Run a preview when the service is available, or review returned preview rows here.</p></EmptyState>} />
    </SectionCard>
  );
};
