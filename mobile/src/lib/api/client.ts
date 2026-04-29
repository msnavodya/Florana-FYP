import axios, { AxiosError, type AxiosRequestConfig } from "axios";

import { API_URL } from "./config";

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
  baseURL: API_URL,
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

  try {
    const response = await api.request<T>({
      url: path,
      method,
      headers: requestHeaders,
      data,
      ...rest,
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: unknown; message?: unknown }>;
    if (axiosError.code === "ECONNABORTED") {
      throw new ApiError(
        `The server took too long to respond at ${API_URL}. Check that the backend is running and reachable from your phone or emulator.`,
        504,
      );
    }

    if (!axiosError.response) {
      throw new ApiError(
        `Cannot reach the backend at ${API_URL}. Start the FastAPI server and use your computer's LAN IP in EXPO_PUBLIC_API_URL when testing on a real phone.`,
        503,
      );
    }

    const detail =
      normalizeApiErrorDetail(axiosError.response?.data?.detail) ||
      normalizeApiErrorDetail(axiosError.response?.data?.message) ||
      axiosError.message ||
      "Request failed";

    throw new ApiError(detail, axiosError.response?.status || 500, detail);
  }
}

export { API_URL };
