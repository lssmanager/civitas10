import { cloneElement, isValidElement, type ReactNode } from "react";
import type { ActionId } from "../contracts/ids";
import { evaluateActionEligibility } from "../evaluation/evaluate-action";
import { visualRegistry } from "../registry";
import { useVisualAuthorization } from "./VisualAuthorizationProvider";

type CanProps = { action: ActionId | string; children: ReactNode; fallback?: ReactNode; mode?: "hide" | "disable" };
export const Can = ({ action, children, fallback = null, mode = "hide" }: CanProps) => {
  const context = useVisualAuthorization();
  const definition = visualRegistry.actionById.get(action as ActionId);
  if (!definition) return mode === "disable" && isValidElement(children) ? cloneElement(children, { disabled: true, "aria-disabled": true, title: "Action unavailable" } as Record<string, unknown>) : <>{fallback}</>;
  const decision = evaluateActionEligibility(definition, context);
  if (decision.visible) return <>{children}</>;
  if (mode === "disable" && isValidElement(children)) return cloneElement(children, { disabled: true, "aria-disabled": true, title: `Unavailable: ${decision.reason}` } as Record<string, unknown>);
  return <>{fallback}</>;
};
