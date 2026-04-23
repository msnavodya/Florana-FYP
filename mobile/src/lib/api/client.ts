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
    const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
    const detail =
      axiosError.response?.data?.detail ||
      axiosError.response?.data?.message ||
      axiosError.message ||
      "Request failed";

    throw new ApiError(detail, axiosError.response?.status || 500, detail);
  }
}

export { API_URL };
