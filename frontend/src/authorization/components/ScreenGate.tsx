import type { ReactNode } from "react";
import type { ScreenId } from "../contracts/ids";
import { evaluateScreenEligibility } from "../evaluation/evaluate-screen";
import { visualRegistry } from "../registry";
import { useVisualAuthorization } from "./VisualAuthorizationProvider";

export const ScreenGate = ({ screenId, children }: { screenId: ScreenId | string; children: ReactNode }) => {
  const context = useVisualAuthorization();
  if (context.status === "loading" || context.status === "idle") return <div className="p-6 text-sm text-slate-600">Loading authorization...</div>;
  if (context.status === "unauthenticated") return <div className="p-6 text-sm text-slate-600">Authentication required.</div>;
  const screen = visualRegistry.screenById.get(screenId as ScreenId);
  if (!screen) return <div className="p-6"><h1 className="text-2xl font-semibold text-slate-900">404 / Screen unknown</h1></div>;
  const decision = evaluateScreenEligibility(screen, context);
  if (decision.allowed) return <>{children}</>;
  const title = decision.reason === "feature_disabled" ? "Feature unavailable" : decision.reason === "organization_context_missing" ? "Organization context required" : context.status === "stale" ? "Temporarily unavailable" : "403 / Access denied";
  return <div className="p-6"><h1 className="text-2xl font-semibold text-slate-900">{title}</h1><p className="mt-2 text-sm text-slate-600">{decision.reason}</p></div>;
};
