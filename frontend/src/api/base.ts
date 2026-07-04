import { useLogto } from "@logto/react";
import { useMemo } from "react";
import { APP_ENV } from "../env";

const API_URL = APP_ENV.api.url;
const API_RESOURCE = APP_ENV.api.resource;

type JwtPayload = {
  aud?: string | string[];
  sub?: string;
  client_id?: string;
  scope?: string;
  [key: string]: unknown;
};

export type ApiError = {
  message: string;
  status?: number;
};

export class ApiRequestError extends Error {
  status?: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status?: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const decodeAccessTokenPayload = (token: string): JwtPayload | null => {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
};

const hasAudience = (payload: JwtPayload | null, resource: string) => {
  const audiences = Array.isArray(payload?.aud) ? payload?.aud : [payload?.aud];
  return audiences.includes(resource);
};

const assertOwnerUserAccessToken = (token: string) => {
  const payload = decodeAccessTokenPayload(token);

  if (payload?.client_id && payload.sub === payload.client_id) {
    throw new ApiRequestError(
      "Owner API token is not a user access token. Check that VITE_LOGTO_APP_ID points to the Logto SPA application, not the backend M2M application.",
      401,
      "OWNER_TOKEN_IS_CLIENT_TOKEN",
      { sub: payload.sub, client_id: payload.client_id, aud: payload.aud },
    );
  }

  if (payload && !hasAudience(payload, API_RESOURCE)) {
    throw new ApiRequestError(
      "Owner API token audience does not match the configured Civitas API resource.",
      401,
      "OWNER_TOKEN_AUDIENCE_MISMATCH",
      { aud: payload.aud, expected: API_RESOURCE },
    );
  }
};

const parseApiErrorBody = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const buildApiErrorMessage = async (response: Response) => {
  const data = await parseApiErrorBody(response);
  const technicalMessage =
    typeof data?.message === "string" && data.message.length > 0
      ? data.message
      : typeof data?.error === "string" && data.error.length > 0
        ? data.error
        : null;

  if (response.status === 401) {
    console.error("Civitas API rejected the access token", data);
    return {
      message: "Your owner session could not be authorized by the Civitas API. Sign out and sign in again; if it continues, verify the Logto SPA app and API resource configuration.",
      code: data?.code || data?.details?.code || "OWNER_API_TOKEN_REJECTED",
      details: data || technicalMessage,
    };
  }

  if (response.status === 403) {
    return {
      message: "Your session is authenticated, but it does not include the owner_global role required for this owner area.",
      code: data?.code || "OWNER_ROLE_REQUIRED",
      details: data || technicalMessage,
    };
  }

  const fallbackMessage = `API request failed: ${response.status} ${response.statusText}`.trim();
  return {
    message: technicalMessage || fallbackMessage,
    code: data?.code || null,
    details: data,
  };
};

const joinApiUrl = (endpoint: string) => `${API_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

export const useApi = () => {
  const { getAccessToken, getOrganizationToken } = useLogto();

  const fetchWithToken = useMemo(
    () => async (endpoint: string, options: RequestInit = {}, organizationId?: string) => {
      try {
        let token: string | undefined;

        if (organizationId) {
          token = await getOrganizationToken(organizationId);
        } else {
          token = await getAccessToken(API_RESOURCE);
        }

        if (!token) {
          throw new ApiRequestError(
            organizationId ? "User is not a member of the organization" : "Failed to get access token for API resource"
          );
        }

        const response = await fetch(joinApiUrl(endpoint), {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
          },
        });

        if (!response.ok) {
          const apiError = await buildApiErrorMessage(response);
          throw new ApiRequestError(apiError.message, response.status, apiError.code, apiError.details);
        }

        return await response.json();
      } catch (error) {
        if (error instanceof ApiRequestError) {
          throw error;
        }
        throw new ApiRequestError(error instanceof Error ? error.message : String(error));
      }
    },
    [getAccessToken, getOrganizationToken]
  );

  const ownerApiFetch = useMemo(
    () => async (endpoint: string, options: RequestInit = {}) => {
      try {
        const token = await getAccessToken(API_RESOURCE);
        if (!token) throw new ApiRequestError("Failed to get access token for owner API resource");
        assertOwnerUserAccessToken(token);

        const response = await fetch(joinApiUrl(endpoint), {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
          },
        });

        if (!response.ok) {
          const apiError = await buildApiErrorMessage(response);
          throw new ApiRequestError(apiError.message, response.status, apiError.code, apiError.details);
        }

        return await response.json();
      } catch (error) {
        if (error instanceof ApiRequestError) throw error;
        throw new ApiRequestError(error instanceof Error ? error.message : String(error));
      }
    },
    [getAccessToken]
  );

  return { fetchWithToken, ownerApiFetch };
};
