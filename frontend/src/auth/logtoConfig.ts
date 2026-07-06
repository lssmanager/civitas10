import type { LogtoConfig } from "@logto/react";
import { APP_ENV } from "../env";
import { LOGTO_OWNER_SHELL_SCOPES } from "../authz/ownerScopes";

export const civitasLogtoConfig: LogtoConfig = {
  endpoint: APP_ENV.logto.endpoint,
  appId: APP_ENV.logto.appId,
  scopes: [...LOGTO_OWNER_SHELL_SCOPES],
  resources: [APP_ENV.api.resource],
};

export const getCivitasSignInOptions = (firstScreen?: "register") => ({
  redirectUri: APP_ENV.app.redirectUri,
  ...(firstScreen ? { firstScreen } : {}),
});
