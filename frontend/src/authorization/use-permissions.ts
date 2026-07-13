import type { PermissionKey } from "./contracts/ids";
import { hasEffectivePermission } from "./permission-checker";
import { useAuthorization } from "./use-authorization";

export const usePermissions = () => {
  const context = useAuthorization();
  return { context, hasPermission: (permission: PermissionKey | string) => hasEffectivePermission(context, permission) };
};
