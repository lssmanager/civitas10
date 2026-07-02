const required = (name: string, value: string | undefined) => {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`Missing required Vite environment variable: ${name}`);
  }
  return normalized;
};

export const APP_ENV = {
  logto: {
    endpoint: required("VITE_LOGTO_ENDPOINT", import.meta.env.VITE_LOGTO_ENDPOINT),
    appId: required("VITE_LOGTO_APP_ID", import.meta.env.VITE_LOGTO_APP_ID),
  },
  api: {
    url: required("VITE_API_URL", import.meta.env.VITE_API_URL),
  },
  app: {
    redirectUri: required("VITE_APP_REDIRECT_URI", import.meta.env.VITE_APP_REDIRECT_URI),
    signOutRedirectUri: required("VITE_APP_SIGNOUT_REDIRECT_URI", import.meta.env.VITE_APP_SIGNOUT_REDIRECT_URI),
  },
} as const;
