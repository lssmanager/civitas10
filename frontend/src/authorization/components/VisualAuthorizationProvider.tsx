import { createContext, useContext, type ReactNode } from "react";
import type { VisualAuthorizationContext } from "../contracts/authorization-context";
import type { PermissionKey } from "../contracts/ids";
import type { MeResponse } from "../../api/me";

export const restrictiveAuthorizationContext: VisualAuthorizationContext = { status: "stale", policyVersion: "unknown", catalogVersion: "unknown", effectivePermissions: new Set(), availableDataScopeCapabilities: new Set(), enabledFeatures: new Set() };
const Context = createContext<VisualAuthorizationContext>(restrictiveAuthorizationContext);
export const VisualAuthorizationProvider = ({ value, children }: { value: VisualAuthorizationContext; children: ReactNode }) => <Context.Provider value={value}>{children}</Context.Provider>;
export const useVisualAuthorization = () => useContext(Context);

export const visualAuthorizationContextFromOwnerMe = (me?: MeResponse): VisualAuthorizationContext => {
  const permissions: PermissionKey[] = [];
  if (me?.auth.owner?.canReadOwner) permissions.push("owner.read" as PermissionKey, "owner.organizations.read" as PermissionKey, "owner.system.read" as PermissionKey, "account.profile.read" as PermissionKey, "governance.owner.read" as PermissionKey, "governance.preview.read" as PermissionKey);
  if (me?.auth.owner?.canWriteOwner) permissions.push("owner.write" as PermissionKey, "owner.organizations.create" as PermissionKey);
  return { status: me ? "ready" : "stale", policyVersion: "owner-legacy-adapter", catalogVersion: "phase2-visual-contract", visualVersion: "96.0", effectivePermissions: new Set(permissions), availableDataScopeCapabilities: new Set(["owner"]), enabledFeatures: new Set(["owner-runtime"]), policyDecisions: new Map() };
};
