/// <reference types="vite/client" />
import { CivitasAuthContract } from "../core/auth/civitas-auth.contract";
const required = (name: string, value: string | undefined) => {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`Missing required Vite environment variable: ${name}`);
  }
  return normalized;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const assertLogicalResource = (name: string, value: string) => {
  if (/^https?:\/\//i.test(value)) {
    throw new Error(`${name} must be a logical Logto API resource identifier, not an HTTP URL`);
  }
  return value;
};

const assertMatchesConstant = (name: string, value: string, expected: string) => {
  if (value !== expected) {
    throw new Error(`${name} must be ${expected}; auth contract drift detected`);
  }
  return value;
};

const resolvedApiBaseUrl = CivitasAuthContract.api.publicUrl;
const resolvedLogtoEndpoint = CivitasAuthContract.logto.issuer;
const resolvedLogtoAppId = required("VITE_LOGTO_APP_ID", import.meta.env.VITE_LOGTO_APP_ID);
const resolvedLogtoResource = assertLogicalResource("CivitasAuthContract.logto.apiResource", CivitasAuthContract.logto.apiResource);
const appRedirectUri = required("VITE_APP_REDIRECT_URI", import.meta.env.VITE_APP_REDIRECT_URI);
const appSignOutRedirectUri = required("VITE_APP_SIGNOUT_REDIRECT_URI", import.meta.env.VITE_APP_SIGNOUT_REDIRECT_URI);

export const civitasConfig = {
  apiBaseUrl: resolvedApiBaseUrl,
  logtoEndpoint: resolvedLogtoEndpoint,
  logtoAppId: resolvedLogtoAppId,
  logtoResource: resolvedLogtoResource,
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
