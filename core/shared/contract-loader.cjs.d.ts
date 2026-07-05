export type CivitasSharedContract = {
  version: string;
  logto: { issuer: string; apiResource: string; managementApi: string; organizationAudiencePrefix: string };
  api: { publicUrl: string };
  auth: {
    global: { ownerRole: string; scopes: Record<string, string> };
    organization: { reservedResource: string; documentScopes: Record<string, string>; roles: Record<string, string> };
    invariants: readonly string[];
  };
};
export function loadCivitasSharedContract(): CivitasSharedContract;
export function loadCivitasAuthContract(): Pick<CivitasSharedContract, "logto" | "api" | "auth">;
