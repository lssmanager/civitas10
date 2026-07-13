import { validateDeploymentConfig } from "../core/deployment/deployment-kernel.cjs";
import { loadCivitasSharedContract } from "../core/shared/contract-loader.cjs";

type FrontendImportMeta = ImportMeta & {
  env: Record<string, string | boolean | undefined>;
};

const sharedContract = loadCivitasSharedContract();
const frontendDeploymentConfig = validateDeploymentConfig({ service: "frontend", env: (import.meta as FrontendImportMeta).env, contract: sharedContract });

export const civitasConfig = {
  apiBaseUrl: frontendDeploymentConfig.apiUrl,
  logtoEndpoint: frontendDeploymentConfig.logtoEndpoint,
  logtoAppId: frontendDeploymentConfig.logtoAppId,
  logtoResource: frontendDeploymentConfig.logtoResource,
  auth: sharedContract.auth,
  isOwnerGlobal: {
    role: sharedContract.auth.global.ownerRole,
    requiredScopes: [sharedContract.auth.global.permissions.ownerProfileRead],
  },
  runtimeFlags: {
    usePublicApiUrlOnly: true,
    coolifyRoutingIsInfrastructureOnly: true,
    enforceLogtoResourceSeparation: true,
  },
  app: {
    callbackPath: "/callback",
    get redirectUri() {
      return `${window.location.origin}/callback`;
    },
    get signOutRedirectUri() {
      return window.location.origin;
    },
  },
} as const;

export const { apiBaseUrl, logtoEndpoint, logtoAppId, logtoResource, isOwnerGlobal, runtimeFlags } = civitasConfig;
