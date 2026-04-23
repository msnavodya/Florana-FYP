import React, { createContext, useContext, useEffect, useState } from "react";

import { loginUser, signupUser } from "../lib/api/auth";
import { clearSession, readSession, writeSession } from "../lib/storage/session";
import type { SessionUser } from "../types/auth";

interface AuthContextValue {
  token: string | null;
  user: SessionUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: {
    full_name: string;
    email: string;
    password: string;
    contact?: string | null;
    location?: string | null;
  }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

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
    const response = await signupUser(payload);
    await writeSession(response.access_token, response.user);
    setToken(response.access_token);
    setUser(response.user);
  };

  const signOut = async () => {
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
        signIn,
        signUp,
        signOut,
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
