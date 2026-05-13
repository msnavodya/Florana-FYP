// Manage shared mobile state for Auth features.
import React, { createContext, useContext, useEffect, useState } from "react";

import { loginUser, signupUser } from "../lib/api/auth";
import { clearSession, readSession, writeSession } from "../lib/storage/session";
import type { SessionUser } from "../types/auth";

interface AuthContextValue {
  token: string | null;
  user: SessionUser | null;
  ready: boolean;
  authNotice: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: {
    full_name: string;
    email: string;
    password: string;
    contact?: string | null;
    location?: string | null;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  setAuthNotice: (message: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    // Restore any cached session once when the app boots so auth-gated screens can hydrate cleanly.
    readSession()
      .then((session) => {
        if (!active) {
          return;
        }

        setToken(session.token);
        setUser(session.user);
      })
      .finally(() => {
        if (active) {
          setReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // Persist the received session immediately so refreshes keep the user signed in.
    const response = await loginUser(email, password);
    await writeSession(response.access_token, response.user);
    setToken(response.access_token);
    setUser(response.user);
  };

  const signUp = async (payload: {
    full_name: string;
    email: string;
    password: string;
    contact?: string | null;
    location?: string | null;
  }) => {
    // Treat signup like an immediate sign-in so new users land in the app already authenticated.
    const response = await signupUser(payload);
    await writeSession(response.access_token, response.user);
    setToken(response.access_token);
    setUser(response.user);
  };

  const signOut = async () => {
    // Clear both memory state and device storage during logout.
    await clearSession();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        ready,
        authNotice,
        signIn,
        signUp,
        signOut,
        setAuthNotice,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}
