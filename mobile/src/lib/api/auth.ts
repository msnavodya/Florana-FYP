import { apiRequest } from "./client";
import type { AuthResponse } from "../../types/auth";

export const loginUser = (email: string, password: string) =>
  apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });

export const signupUser = (payload: {
  full_name: string;
  email: string;
  password: string;
  contact?: string | null;
  location?: string | null;
}) =>
  apiRequest<AuthResponse>("/auth/signup", {
    method: "POST",
    body: payload,
  });
