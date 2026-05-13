// Wrap mobile API requests related to Health.
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

// Check whether the backend server, database, and AI model are available right now.
export const getBackendHealth = () => apiRequest<BackendHealthResponse>("/health");
