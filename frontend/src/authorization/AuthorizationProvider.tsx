import { useEffect, useState, type ReactNode } from "react";
import { useLogto } from "@logto/react";
import { normalizeAuthorizationContext } from "./permission-checker";
import { useAuthorizationContextClient } from "./authorization-client";
import type { VisualAuthorizationContext } from "./contracts/authorization-context";
import { restrictiveAuthorizationContext, VisualAuthorizationProvider } from "./components/VisualAuthorizationProvider";

export const TenantAuthorizationProvider = ({ organizationId, children }: { organizationId: string; children: ReactNode }) => {
  const { isAuthenticated } = useLogto();
  const client = useAuthorizationContextClient();
  const [context, setContext] = useState<VisualAuthorizationContext>({ ...restrictiveAuthorizationContext, status: "loading", organizationId });

  useEffect(() => {
    let active = true;
    if (!isAuthenticated) {
      setContext({ ...restrictiveAuthorizationContext, status: "unauthenticated", organizationId });
      return () => { active = false; };
    }
    setContext({ ...restrictiveAuthorizationContext, status: "loading", organizationId });
    void client.getTenantAuthorizationContext(organizationId)
      .then((response) => { if (active) setContext(normalizeAuthorizationContext(response)); })
      .catch(() => { if (active) setContext({ ...restrictiveAuthorizationContext, status: "error", organizationId }); });
    return () => { active = false; };
  }, [client, isAuthenticated, organizationId]);

  return <VisualAuthorizationProvider value={context}>{children}</VisualAuthorizationProvider>;
};
