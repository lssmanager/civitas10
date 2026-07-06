import { useLogto } from "@logto/react";
import { useEffect, useState, type ReactNode } from "react";
import { getMe, type MeResponse } from "../api/me";
import { APP_ENV } from "../env";
import { OWNER_GLOBAL_ROLE } from "./rbacMatrix";

type OwnerRouteGuardState =
  | { status: "loading" }
  | { status: "authorized"; me: MeResponse }
  | { status: "denied"; message: string };

export const ownerHasGlobalAccess = (me?: MeResponse | null) => Boolean(me?.auth?.globalRoles?.includes(OWNER_GLOBAL_ROLE));

export function OwnerRouteGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, getAccessToken } = useLogto();
  const [state, setState] = useState<OwnerRouteGuardState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    async function validateOwnerAccess() {
      setState({ status: "loading" });
      if (!isAuthenticated) {
        setState({ status: "denied", message: "Access denied" });
        return;
      }
      try {
        const token = await getAccessToken(APP_ENV.api.resource);
        if (!token) throw new Error("No API access token was returned for the Civitas API resource.");
        const me = await getMe(token);
        if (!active) return;
        if (!ownerHasGlobalAccess(me)) {
          setState({ status: "denied", message: "403 / Access denied" });
          return;
        }
        setState({ status: "authorized", me });
      } catch (error) {
        if (!active) return;
        setState({ status: "denied", message: error instanceof Error ? `403 / Access denied: ${error.message}` : "403 / Access denied" });
      }
    }
    validateOwnerAccess();
    return () => { active = false; };
  }, [getAccessToken, isAuthenticated]);

  if (state.status === "loading") return <div className="p-6 text-sm text-slate-600">Validando permisos...</div>;
  if (state.status === "denied") return <div className="p-6"><h1 className="text-2xl font-semibold text-slate-900">403 / Access denied</h1><p className="mt-2 text-sm text-slate-600">{state.message}</p></div>;
  return <>{children}</>;
}
