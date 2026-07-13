import { useState } from "react";
import { SectionCard, StatusPill } from "../../../../shared/ui";
import type { ActionId, ScreenId } from "../../../../authorization/contracts/ids";
import type { GovernanceAccessPreview, GovernanceAccessPreviewRequest, GovernanceSurface, PermissionMatrixReason } from "../../contracts";
import { formatSourceVersions } from "../permission-matrix/reason-format";

const previewVersions = (preview: GovernanceAccessPreview) => formatSourceVersions(preview.decision.sourceVersions as PermissionMatrixReason["sourceVersions"]);

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
    <SectionCard title="Access preview" description="Read-only simulation: explains effective decisions without minting tokens or mutating grants." actions={<StatusPill status="warning">preview — no muta estado</StatusPill>}>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]" data-access-preview-flow="actor-action-simulate-explanation">
        <label className="text-sm font-medium text-muted-strong">Actor / role simulated<input className="civitas-input mt-1" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} placeholder="user_123 or organization_headteacher" /></label>
        <label className="text-sm font-medium text-muted-strong">Action or screen<input className="civitas-input mt-1" value={targetId} onChange={(event) => setTargetId(event.target.value)} placeholder="lms.grades.edit" /></label>
        <label className="text-sm font-medium text-muted-strong">Type<select className="civitas-input mt-1" value={targetType} onChange={(event) => setTargetType(event.target.value as "action" | "screen")}><option value="action">Action</option><option value="screen">Screen</option></select></label>
        <button type="button" className="civitas-primary-button self-end" disabled={!subjectId || !targetId || loading} onClick={() => void simulatePreview()}>{loading ? "Simulating..." : "Simulate"}</button>
      </div>
      {error ? <p className="mt-3 text-sm text-danger-strong">{error}</p> : null}
      <div className="mt-4 space-y-3">
        {visiblePreviews.map((preview) => <article key={`${preview.subjectId}-${preview.actionId || preview.screenId}-${preview.decision.reason}`} className="civitas-card civitas-pad-tight">
          <div className="grid gap-3 md:grid-cols-2">
            <div data-access-preview-decision="true"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Effective decision</p><StatusPill status={preview.decision.allowed ? "success" : "warning"}>{preview.decision.allowed ? "✓ allowed" : "✕ denied"}</StatusPill></div>
            <div data-access-preview-explanation="true"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Explanation</p><p className="text-sm text-muted-strong">{preview.decision.reason}</p><p className="text-xs font-mono text-muted">{previewVersions(preview)}</p></div>
          </div>
          <p className="mt-3 text-sm text-muted-strong">{preview.subjectId} → {preview.actionId || preview.screenId}</p>
        </article>)}
      </div>
      {visiblePreviews.length === 0 ? <p className="mt-3 text-sm text-muted-strong">No preview rows were returned.</p> : null}
    </SectionCard>
  );
};
