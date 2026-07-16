import { APP_ENV } from "../env";
import { ApiRequestError, readJsonResponse } from "./base";

export type MeResponse = {
  auth: {
    sub: string | null;
    organizationId: string | null;
    scopes: string[];
    roles: string[];
    globalRoles: string[];
    organizationRoles: string[];
    owner: {
      canReadOwner: boolean;
      canWriteOwner: boolean;
    };
  };
};

export async function getMe(accessToken: string): Promise<MeResponse> {
  const response = await fetch(`${APP_ENV.api.url}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new ApiRequestError(`Failed to load /me (${response.status})`, response.status, "ME_REQUEST_FAILED", await readJsonResponse(response).catch((error) => error instanceof ApiRequestError ? error.details : null));
  }

  return readJsonResponse<MeResponse>(response);
}
