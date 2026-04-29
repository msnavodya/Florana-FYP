import { apiRequest } from "./client";

export interface BackendHealthResponse {
  status: string;
  server: string;
  timestamp: string;
  database?: {
    status?: string;
    message?: string;
  };
  ai_model?: {
    loaded: boolean;
    status: string;
  };
}

export const getBackendHealth = () => apiRequest<BackendHealthResponse>("/health");
