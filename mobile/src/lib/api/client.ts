import axios, { AxiosError, type AxiosRequestConfig } from "axios";

import {
  API_URL,
  API_URL_REQUIRES_LAN_ON_DEVICE,
  CONFIGURED_API_HOSTNAME,
  getApiUrl,
  getApiUrlCandidates,
  setApiUrl,
} from "./config";

export class ApiError extends Error {
  status: number;
  detail?: string;

  constructor(message: string, status = 500, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

interface RequestOptions extends Omit<AxiosRequestConfig, "data" | "url" | "baseURL" | "headers" | "method"> {
  method?: AxiosRequestConfig["method"];
  token?: string | null;
  headers?: Record<string, string>;
  body?: FormData | URLSearchParams | string | Record<string, unknown> | null;
}

const api = axios.create({
  timeout: 15000,
});

function normalizeApiErrorDetail(detail: unknown): string | undefined {
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((entry) => {
        if (typeof entry === "string") {
          return entry;
        }

        if (entry && typeof entry === "object") {
          const record = entry as { loc?: unknown; msg?: unknown; message?: unknown };
          const loc = Array.isArray(record.loc) ? record.loc.join(".") : null;
          const msg =
            typeof record.msg === "string"
              ? record.msg
              : typeof record.message === "string"
                ? record.message
                : null;

          if (loc && msg) {
            return `${loc}: ${msg}`;
          }

          if (msg) {
            return msg;
          }
        }

        return null;
      })
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) {
      return messages.join(", ");
    }
  }

  if (detail && typeof detail === "object") {
    const record = detail as { message?: unknown; detail?: unknown };
    if (typeof record.message === "string") {
      return record.message;
    }
    if (typeof record.detail === "string") {
      return record.detail;
    }
  }

  return undefined;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, body, method = "GET", ...rest } = options;
  const requestHeaders: Record<string, string> = {
    ...(headers || {}),
  };

  let data: unknown;
  if (body == null) {
    data = undefined;
  } else if (typeof body === "string" || body instanceof FormData || body instanceof URLSearchParams) {
    data = body;
  } else {
    requestHeaders["Content-Type"] = "application/json";
    data = body;
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const candidateUrls = [getApiUrl(), ...getApiUrlCandidates()].filter((value, index, items) => items.indexOf(value) === index);
  let lastError: AxiosError<{ detail?: unknown; message?: unknown }> | null = null;

  for (const baseURL of candidateUrls) {
    try {
      const response = await api.request<T>({
        baseURL,
        url: path,
        method,
        headers: requestHeaders,
        data,
        ...rest,
      });
      setApiUrl(baseURL);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: unknown; message?: unknown }>;
      lastError = axiosError;

      if (axiosError.response) {
        const detail =
          normalizeApiErrorDetail(axiosError.response?.data?.detail) ||
          normalizeApiErrorDetail(axiosError.response?.data?.message) ||
          axiosError.message ||
          "Request failed";

        throw new ApiError(detail, axiosError.response?.status || 500, detail);
      }

      if (axiosError.code === "ECONNABORTED" && baseURL === candidateUrls[candidateUrls.length - 1]) {
        throw new ApiError(
          `The server took too long to respond. Tried: ${candidateUrls.join(", ")}`,
          504,
        );
      }
    }
  }

  const lanSetupHint = API_URL_REQUIRES_LAN_ON_DEVICE
    ? ` On Expo Go on a real Android phone, ${CONFIGURED_API_HOSTNAME} is not reachable. Set EXPO_PUBLIC_API_BASE_URL (or EXPO_PUBLIC_API_URL) to your computer's LAN IP, for example http://192.168.1.10:8000, and make sure the backend is listening on 0.0.0.0.`
    : "";

  throw new ApiError(
    `Cannot reach the backend. Tried: ${candidateUrls.join(", ")}. Current configured URL: ${API_URL}.${lanSetupHint}`,
    503,
    lastError?.message,
  );
}

export { API_URL };
