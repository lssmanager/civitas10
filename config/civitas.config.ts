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
