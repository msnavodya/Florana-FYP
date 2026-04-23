export interface SessionUser {
  id?: string;
  _id?: string;
  email: string;
  full_name?: string;
  contact?: string | null;
  location?: string | null;
}

export interface AuthResponse {
  message?: string;
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  user: SessionUser;
  storage?: string;
}
