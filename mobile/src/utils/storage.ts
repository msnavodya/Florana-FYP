import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getStoredJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setStoredJson<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
