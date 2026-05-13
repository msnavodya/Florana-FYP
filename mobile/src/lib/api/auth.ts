// Wrap mobile API requests related to Auth.
import { apiRequest } from "./client";
import type { AuthResponse } from "../../types/auth";

// Submit the email and password pair to create an authenticated mobile session.
export const loginUser = (email: string, password: string) =>
  apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });

// Create an account and return the same auth payload used by the sign-in flow.
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
