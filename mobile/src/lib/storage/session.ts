// Handle mobile local storage for Session data.
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { SessionUser } from "../../types/auth";
import { storageKeys } from "./keys";

export interface StoredSession {
  token: string | null;
  user: SessionUser | null;
}

// Read both token and user details together so auth hydration stays in sync.
export async function readSession(): Promise<StoredSession> {
  const [token, userRaw] = await Promise.all([
    AsyncStorage.getItem(storageKeys.token),
    AsyncStorage.getItem(storageKeys.user),
  ]);

  return {
    token,
    user: userRaw ? (JSON.parse(userRaw) as SessionUser) : null,
  };
}

export async function writeSession(token: string, user: SessionUser) {
  // Persist both parts of the session at once after sign-in or signup succeeds.
  await Promise.all([
    AsyncStorage.setItem(storageKeys.token, token),
    AsyncStorage.setItem(storageKeys.user, JSON.stringify(user)),
  ]);
}

export async function clearSession() {
  // Remove all auth-specific storage when the user signs out.
  await Promise.all([
    AsyncStorage.removeItem(storageKeys.token),
    AsyncStorage.removeItem(storageKeys.user),
  ]);
}
