/// <reference types="vite/client" />
import { validateDeploymentConfig } from "../core/deployment/deployment-kernel.cjs";
const frontendDeploymentConfig = validateDeploymentConfig({ service: "frontend", env: import.meta.env });

export const civitasConfig = {
  apiBaseUrl: frontendDeploymentConfig.apiUrl,
  logtoEndpoint: frontendDeploymentConfig.logtoEndpoint,
  logtoAppId: frontendDeploymentConfig.logtoAppId,
  logtoResource: frontendDeploymentConfig.logtoResource,
  isOwnerGlobal: {
    role: "owner_global",
    requiredScopes: ["owner:read"],
  },
  runtimeFlags: {
    usePublicApiUrlOnly: true,
    coolifyRoutingIsInfrastructureOnly: true,
    enforceLogtoResourceSeparation: true,
  },
  app: {
    redirectUri: frontendDeploymentConfig.redirectUri,
    signOutRedirectUri: frontendDeploymentConfig.signOutRedirectUri,
  },
} as const;

export const { apiBaseUrl, logtoEndpoint, logtoAppId, logtoResource, isOwnerGlobal, runtimeFlags } = civitasConfig;
