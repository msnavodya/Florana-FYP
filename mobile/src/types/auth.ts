// Define shared mobile TypeScript types for Auth data.
// User details kept in memory and local storage after authentication.
export interface SessionUser {
  id?: string;
  _id?: string;
  email: string;
  full_name?: string;
  contact?: string | null;
  location?: string | null;
}

// Backend auth response shared by both login and signup flows.
export interface AuthResponse {
  message?: string;
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  user: SessionUser;
  storage?: string;
}
