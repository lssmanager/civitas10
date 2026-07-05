/// <reference types="vite/client" />
const required = (name: string, value: string | undefined) => {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`Missing required Vite environment variable: ${name}`);
  }
  return normalized;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const resolvedApiBaseUrl = trimTrailingSlash(required("VITE_API_URL", import.meta.env.VITE_API_URL));
const resolvedLogtoEndpoint = trimTrailingSlash(required("VITE_LOGTO_ENDPOINT", import.meta.env.VITE_LOGTO_ENDPOINT));
const resolvedLogtoAppId = required("VITE_LOGTO_APP_ID", import.meta.env.VITE_LOGTO_APP_ID);
const appRedirectUri = required("VITE_APP_REDIRECT_URI", import.meta.env.VITE_APP_REDIRECT_URI);
const appSignOutRedirectUri = required("VITE_APP_SIGNOUT_REDIRECT_URI", import.meta.env.VITE_APP_SIGNOUT_REDIRECT_URI);

export const civitasConfig = {
  apiBaseUrl: resolvedApiBaseUrl,
  logtoEndpoint: resolvedLogtoEndpoint,
  logtoAppId: resolvedLogtoAppId,
  logtoResource: resolvedApiBaseUrl,
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
    redirectUri: appRedirectUri,
    signOutRedirectUri: appSignOutRedirectUri,
  },
} as const;

export const { apiBaseUrl, logtoEndpoint, logtoAppId, logtoResource, isOwnerGlobal, runtimeFlags } = civitasConfig;
