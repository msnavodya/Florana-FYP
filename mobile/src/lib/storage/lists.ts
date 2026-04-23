import AsyncStorage from "@react-native-async-storage/async-storage";

import { storageKeys } from "./keys";

export async function readStringList<T>(key: keyof typeof storageKeys): Promise<T[]> {
  const raw = await AsyncStorage.getItem(storageKeys[key]);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}
