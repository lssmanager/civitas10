import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertStrip, EmptyState, StateRegion } from "../shared/ui";
import { MetricCard, OwnerBadge, OwnerShell, PageHeader, ownerToneFromSeverity } from "../components/owner/OwnerUI";
import { ApiRequestError } from "../api/base";
import { useOwnerApi } from "../api/owner";
import { appRoutes } from "../navigation/routes";
import { toAppErrorPresentation, type AppErrorPresentation } from "../errors/appErrorPresentation";
import type { ConsolidatedOperationalResponse, OperationalBlock, OwnerCapabilityState } from "../contracts/operational";

const actionLabel: Record<string, string> = { retry: "Retry", verify_provider: "Verify provider", open_organization: "Open organization", wait_first_wordpress_login: "Wait first WordPress login", manual_retry_required: "Manual retry required", human_action_required: "Human action required", none: "No action" };

type OrganizationDetailState =
  | { status: "loading" }
  | { status: "loaded"; organization: ConsolidatedOperationalResponse }
  | { status: "not-found"; organizationId: string }
  | { status: "denied"; message: string }
  | { status: "error"; error: AppErrorPresentation };

const isInvalidOrganizationId = (value: string | undefined) => {
  const id = value ? value.trim() : "";
  if (!id) return true;
  const decoded = (() => { try { return decodeURIComponent(id); } catch { return id; } })();
  return decoded === `:${"organizationId"}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const isOperationalBlock = (value: unknown): value is OperationalBlock => isRecord(value) && typeof value.status === "string" && typeof value.severity === "string" && isRecord(value.freshness);

const isCapabilityState = (value: unknown): value is OwnerCapabilityState => isRecord(value) && typeof value.capability === "string" && typeof value.label === "string" && typeof value.configured === "boolean" && isRecord(value.health) && typeof value.health.status === "string" && Array.isArray(value.blockers) && Array.isArray(value.nextActions);

const isOperationalResponse = (value: unknown): value is ConsolidatedOperationalResponse => {
  if (!isRecord(value) || !isRecord(value.organization) || !Array.isArray(value.capabilities) || !isRecord(value.summary) || !isRecord(value.polling)) return false;
  if (typeof value.contractVersion !== "string" || !value.contractVersion.includes("owner-capability-surfaces")) return false;
  if (typeof value.summary.status !== "string") return false;
  if (value.worker !== null && value.worker !== undefined && !isOperationalBlock(value.worker)) return false;
  return value.capabilities.every(isCapabilityState);
};

function normalizeLoadFailure(caught: unknown, organizationId: string): OrganizationDetailState {
  if (caught instanceof ApiRequestError && caught.status === 404) return { status: "not-found", organizationId };
  const error = toAppErrorPresentation(caught);
  if (error.status === 401 || error.status === 403) return { status: "denied", message: error.humanMessage };
  return { status: "error", error };
}

function BlockCard({ title, block }: { title: string; block: OperationalBlock }) {
  return (
    <article className="owner-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{title}</p>
          <h3 className="mt-2 text-lg font-semibold text-text">{block.humanMessage || block.status}</h3>
        </div>
        <OwnerBadge tone={ownerToneFromSeverity(block.severity)}>{block.severity}</OwnerBadge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <OwnerBadge tone={ownerToneFromSeverity(block.status === "ok" || block.status === "healthy" ? "success" : block.severity)}>{block.status}</OwnerBadge>
        <span className="inline-flex rounded-full bg-neutral-soft px-2.5 py-1 text-xs font-medium text-muted-strong">{block.freshness.source}</span>
      </div>
      <dl className="mt-5 grid gap-3 text-sm text-muted-strong sm:grid-cols-2">
        <div><dt className="font-medium text-text">Provider code</dt><dd className="mt-1 break-all">{block.providerCode || "-"}</dd></div>
        <div><dt className="font-medium text-text">Provider status</dt><dd className="mt-1 break-all">{String(block.providerStatus || "-")}</dd></div>
        <div><dt className="font-medium text-text">Checked at</dt><dd className="mt-1">{block.freshness.checkedAt || "-"}</dd></div>
        <div><dt className="font-medium text-text">Next action</dt><dd className="mt-1">{actionLabel[String(block.nextAction)] || String(block.nextAction)}</dd></div>
      </dl>
    </article>
  );
}

function CapabilityCard({ capability }: { capability: OwnerCapabilityState }) {
  const blockers = capability.blockers.length;
  return (
    <article className="owner-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{capability.capability}</p>
          <h3 className="mt-2 text-lg font-semibold text-text">{capability.label}</h3>
          <p className="mt-2 text-sm text-muted-strong">{capability.health.humanMessage || (capability.configured ? "Capability configured." : "Capability not configured.")}</p>
        </div>
        <OwnerBadge tone={ownerToneFromSeverity(capability.health.severity || (capability.configured ? "success" : "info"))}>{capability.health.status}</OwnerBadge>
      </div>
      <dl className="mt-5 grid gap-3 text-sm text-muted-strong sm:grid-cols-2">
        <div><dt className="font-medium text-text">Adapter</dt><dd className="mt-1">{capability.adapter?.label || "Not configured"}</dd></div>
        <div><dt className="font-medium text-text">Runtime source</dt><dd className="mt-1">{capability.runtimeState.source}</dd></div>
        <div><dt className="font-medium text-text">Blockers</dt><dd className="mt-1">{blockers}</dd></div>
        <div><dt className="font-medium text-text">Next actions</dt><dd className="mt-1">{capability.nextActions.length}</dd></div>
      </dl>
    </article>
  );
}

const OwnerOrganizationOperationalPage = () => {
  const { organizationId = "" } = useParams();
  const ownerApi = useOwnerApi();
  const [viewState, setState] = useState<OrganizationDetailState>({ status: "loading" });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestLoadedStateRef = useRef<ConsolidatedOperationalResponse | null>(null);

  const load = useCallback(async () => {
    if (isInvalidOrganizationId(organizationId)) {
      setState({ status: "not-found", organizationId });
      return;
    }
    setState((current) => current.status === "loaded" ? current : { status: "loading" });
    try {
      const response = await ownerApi.getOrganizationOperationalState(organizationId);
      if (!isOperationalResponse(response)) throw new ApiRequestError("Owner organization operational response did not match the expected contract.", 500, "OWNER_ORGANIZATION_CONTRACT_ERROR");
      latestLoadedStateRef.current = response;
      setState({ status: "loaded", organization: response });
      const interval = response.polling?.shouldPoll ? Math.max(Number(response.polling.intervalSeconds || 3), 1) * 1000 : 0;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = interval ? setTimeout(() => void load(), interval) : null;
    } catch (caught) {
      setState(normalizeLoadFailure(caught, organizationId));
      const state = latestLoadedStateRef.current;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (state?.polling?.shouldPoll) timerRef.current = setTimeout(() => void load(), Math.max(Number(state.polling.intervalSeconds || 3), 1) * 1000);
      else timerRef.current = null;
    }
  }, [organizationId, ownerApi]);

  useEffect(() => {
    void load();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [load]);

  const title = viewState.status === "loaded" ? viewState.organization.organization.name || organizationId : organizationId;
  const retry = viewState.status === "error" && viewState.error.retryable ? () => void load() : undefined;

  return (
    <OwnerShell organizationId={organizationId}>
      <PageHeader eyebrow="Organization detail" title={title || "Organization not found"} description="Selected organization context for Overview, Governance and Operations." />
      <nav className="civitas-card civitas-pad-tight" aria-label="Organization detail sections" data-owner-organization-detail-tabs="true">
        <div className="flex flex-wrap gap-2">
          <Link to={!isInvalidOrganizationId(organizationId) ? appRoutes.ownerOrganizationState.build?.({ organizationId }) ?? appRoutes.ownerOrganizations.path : appRoutes.ownerOrganizations.path} className="civitas-primary-button" aria-current="page">Overview</Link>
          <Link to={!isInvalidOrganizationId(organizationId) ? appRoutes.ownerOrganizationGovernance.build?.({ organizationId }) ?? appRoutes.ownerOrganizations.path : appRoutes.ownerOrganizations.path} className="civitas-secondary-button">Governance</Link>
          <a href="#operations" className="civitas-secondary-button">Operations</a>
        </div>
      </nav>
      {viewState.status === "loading" ? <StateRegion><p className="text-sm text-muted-strong">Loading organization detail...</p></StateRegion> : null}
      {viewState.status === "not-found" ? <EmptyState message="Organization not found. The selected organization does not exist or is no longer available."><Link className="civitas-secondary-button" to={appRoutes.ownerOrganizations.path}>Return to Directory</Link></EmptyState> : null}
      {viewState.status === "denied" ? <StateRegion><AlertStrip variant="warning" title="Access denied">{viewState.message}</AlertStrip></StateRegion> : null}
      {viewState.status === "error" ? <StateRegion><AlertStrip variant="danger" title={`Organization detail error · ${viewState.error.code}`}>{viewState.error.humanMessage}{retry ? <button type="button" className="civitas-secondary-button" onClick={retry}>Try again</button> : null}<Link className="civitas-secondary-button" to={appRoutes.ownerOrganizations.path}>Return to Directory</Link></AlertStrip></StateRegion> : null}
      {viewState.status === "loaded" ? <><section id="operations" className="grid gap-4 md:grid-cols-4"><MetricCard label="Summary" detail={viewState.organization.summary?.humanMessage || "Capability surface loaded."}><OwnerBadge tone={ownerToneFromSeverity(viewState.organization.summary?.severity || "info")}>{viewState.organization.summary?.status || "available"}</OwnerBadge></MetricCard><MetricCard label="Capabilities" value={viewState.organization.capabilities.length} detail="Owner capability surface returned by the backend contract." /><MetricCard label="Blockers" value={viewState.organization.blockers.length} detail="Aggregated capability blockers." /><MetricCard label="Polling" value={viewState.organization.polling?.shouldPoll ? `${viewState.organization.polling.intervalSeconds}s` : "stopped"} detail={viewState.organization.polling?.reason || "-"} /></section><section className="grid gap-4 lg:grid-cols-2">{viewState.organization.capabilities.map((capability) => <CapabilityCard key={capability.capability} capability={capability} />)}{viewState.organization.worker ? <BlockCard title="Worker" block={viewState.organization.worker} /> : null}</section></> : null}
    </OwnerShell>
  );
};

export default OwnerOrganizationOperationalPage;
