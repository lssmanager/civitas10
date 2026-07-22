import { createContext, useContext, type ReactNode } from "react";
import type { VisualAuthorizationContext } from "../contracts/authorization-context";
import type { PermissionKey } from "../contracts/ids";
import type { MeResponse } from "../../api/me";

export const restrictiveAuthorizationContext: VisualAuthorizationContext = { status: "stale", policyVersion: "unknown", catalogVersion: "unknown", effectivePermissions: new Set(), availableDataScopeCapabilities: new Set(), enabledFeatures: new Set() };
const Context = createContext<VisualAuthorizationContext>(restrictiveAuthorizationContext);
export const VisualAuthorizationProvider = ({ value, children }: { value: VisualAuthorizationContext; children: ReactNode }) => <Context.Provider value={value}>{children}</Context.Provider>;
export const useVisualAuthorization = () => useContext(Context);

export const visualAuthorizationContextFromOwnerMe = (me?: MeResponse, organizationId?: string): VisualAuthorizationContext => {
  const permissions: PermissionKey[] = [];
  if (me?.auth.owner?.canReadOwner) permissions.push("owner.profile.read" as PermissionKey, "owner.organizations.read" as PermissionKey, "owner.runtime.read" as PermissionKey);
  if (me?.auth.owner?.canWriteOwner) permissions.push("owner.runtime.operations.execute" as PermissionKey, "owner.organizations.create" as PermissionKey);
  return { status: me ? "ready" : "stale", organizationId, policyVersion: "owner-legacy-adapter", catalogVersion: "57adc4a7b28cb5ddb79bb7f66257d5d226cf27e174f22a7b0a19628aebf4e76d", visualVersion: "96.0", effectivePermissions: new Set(permissions), availableDataScopeCapabilities: new Set(["owner"]), enabledFeatures: new Set(["owner-runtime"]), policyDecisions: new Map() };
};
