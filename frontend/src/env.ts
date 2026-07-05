import { civitasConfig } from "../../config/civitas.config";

export const APP_ENV = {
  logto: {
    endpoint: civitasConfig.logtoEndpoint,
    appId: civitasConfig.logtoAppId,
  },
  api: {
    url: civitasConfig.apiBaseUrl,
    resource: civitasConfig.logtoResource,
  },
  app: civitasConfig.app,
} as const;
