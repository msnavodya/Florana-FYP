import AsyncStorage from "@react-native-async-storage/async-storage";

import type { SessionUser } from "../../types/auth";
import { storageKeys } from "./keys";

export interface StoredSession {
  token: string | null;
  user: SessionUser | null;
}

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
  await Promise.all([
    AsyncStorage.setItem(storageKeys.token, token),
    AsyncStorage.setItem(storageKeys.user, JSON.stringify(user)),
  ]);
}

export async function clearSession() {
  await Promise.all([
    AsyncStorage.removeItem(storageKeys.token),
    AsyncStorage.removeItem(storageKeys.user),
  ]);
}
