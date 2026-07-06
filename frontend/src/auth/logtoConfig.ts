import type { LogtoConfig } from "@logto/react";
import { APP_ENV } from "../env";
import { LOGTO_OWNER_SHELL_SCOPES } from "../authz/ownerScopes";

export const civitasLogtoConfig: LogtoConfig = {
  endpoint: APP_ENV.logto.endpoint,
  appId: APP_ENV.logto.appId,
  // Keep owner access global: request the Civitas API resource and the global
  // owner shell scopes at SPA sign-in. Do not request organization resources
  // here; organization-scoped authorization is handled by getOrganizationToken().
  scopes: [...LOGTO_OWNER_SHELL_SCOPES],
  resources: [APP_ENV.api.resource],
};

export const getCivitasSignInOptions = (firstScreen?: "register") => ({
  redirectUri: APP_ENV.app.redirectUri,
  ...(firstScreen ? { firstScreen } : {}),
});
