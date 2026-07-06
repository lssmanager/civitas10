import type { MeResponse } from "../api/me";
import { civitasConfig } from "../../../config/civitas.config";

export const OWNER_GLOBAL_ROLE = civitasConfig.auth.global.ownerRole;
export const OWNER_SCOPES = {
  read: civitasConfig.auth.global.scopes.ownerRead,
  write: civitasConfig.auth.global.scopes.ownerWrite,
  runtimeRead: civitasConfig.auth.global.scopes.runtimeRead,
  runtimeWrite: civitasConfig.auth.global.scopes.runtimeWrite,
  workerQueuesRead: civitasConfig.auth.global.scopes.workerQueuesRead,
  workerQueuesWrite: civitasConfig.auth.global.scopes.workerQueuesWrite,
  organizationsCreate: civitasConfig.auth.global.scopes.organizationCreate,
  organizationsRead: civitasConfig.auth.global.scopes.organizationRead,
  organizationsWrite: civitasConfig.auth.global.scopes.organizationWrite,
  impersonationWrite: civitasConfig.auth.global.scopes.impersonationWrite,
} as const;

export const OWNER_SHELL_REQUIRED_SCOPES = Object.freeze([
  OWNER_SCOPES.read,
  OWNER_SCOPES.organizationsRead,
  OWNER_SCOPES.organizationsCreate,
  OWNER_SCOPES.runtimeRead,
  OWNER_SCOPES.workerQueuesRead,
]);

export const OIDC_LOGIN_SCOPES = Object.freeze(["openid", "profile", "email"]);
export const LOGTO_OWNER_SHELL_SCOPES = Object.freeze([...OIDC_LOGIN_SCOPES, ...OWNER_SHELL_REQUIRED_SCOPES]);

export const getMissingScopes = (actualScopes: string[] = [], requiredScopes: readonly string[] = OWNER_SHELL_REQUIRED_SCOPES) => {
  const actual = new Set(actualScopes);
  return requiredScopes.filter((scope) => !actual.has(scope));
};

export const ownerHasGlobalRole = (me?: MeResponse | null) => Boolean(me?.auth?.globalRoles?.includes(OWNER_GLOBAL_ROLE));
export const getMissingOwnerShellScopes = (me?: MeResponse | null) => getMissingScopes(me?.auth?.scopes ?? []);
export const ownerHasRequiredGlobalScopes = (me?: MeResponse | null) => getMissingOwnerShellScopes(me).length === 0;
export const ownerHasGlobalAccess = (me?: MeResponse | null) => ownerHasGlobalRole(me) && ownerHasRequiredGlobalScopes(me);
