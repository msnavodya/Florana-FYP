import Constants from "expo-constants";
import { Platform } from "react-native";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const getHostFromExpo = () => {
  const possibleHosts = [
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri,
    (Constants.expoGoConfig as { debuggerHost?: string } | null)?.debuggerHost,
    (
      Constants.manifest2 as {
        extra?: {
          expoClient?: {
            hostUri?: string;
          };
        };
      } | null
    )?.extra?.expoClient?.hostUri,
  ];

  for (const entry of possibleHosts) {
    if (!entry) {
      continue;
    }

    const host = entry.split(":")[0]?.trim();
    if (host) {
      return host;
    }
  }

  return null;
};

const getDefaultApiUrl = () => {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  }

  const expoHost = getHostFromExpo();
  if (expoHost) {
    return `http://${expoHost}:8000`;
  }

  return "http://127.0.0.1:8000";
};

export const API_URL = trimTrailingSlash(process.env.EXPO_PUBLIC_API_URL || getDefaultApiUrl());

export const buildApiUrl = (path = "") => {
  if (!path) {
    return API_URL;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
};
