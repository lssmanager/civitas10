import { ApiRequestError } from "../api/base";

export type AppErrorPresentation = {
  code: string;
  humanMessage: string;
  technicalMessage?: string;
  retryable: boolean;
  status?: number;
};

const ORGANIZATION_LOAD_MESSAGE = "The organization could not be loaded.";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

export function toAppErrorPresentation(error: unknown, fallbackMessage = ORGANIZATION_LOAD_MESSAGE): AppErrorPresentation {
  if (error instanceof ApiRequestError) {
    const details = isRecord(error.details) ? error.details : null;
    const detailMessage = typeof details?.humanMessage === "string" ? details.humanMessage : typeof details?.message === "string" ? details.message : typeof details?.error === "string" ? details.error : null;
    const message = detailMessage || error.message || fallbackMessage;
    return {
      code: error.code || (error.status ? `http_${error.status}` : "api_error"),
      humanMessage: message,
      technicalMessage: error.message || undefined,
      retryable: !error.status || error.status >= 500,
      status: error.status,
    };
  }

  if (isRecord(error)) {
    const status = typeof error.status === "number" ? error.status : undefined;
    const code = typeof error.code === "string" && error.code ? error.code : status ? `http_${status}` : "api_error";
    const message = typeof error.humanMessage === "string" && error.humanMessage
      ? error.humanMessage
      : typeof error.message === "string" && error.message
        ? error.message
        : typeof error.error === "string" && error.error
          ? error.error
          : fallbackMessage;
    return { code, humanMessage: message, technicalMessage: typeof error.message === "string" ? error.message : undefined, retryable: !status || status >= 500, status };
  }

  if (error instanceof Error) {
    return { code: "unexpected_error", humanMessage: fallbackMessage, technicalMessage: error.message, retryable: true };
  }

  return { code: "unknown_error", humanMessage: fallbackMessage, retryable: true };
}
