import { Platform } from "react-native";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const getDefaultApiUrl = () => {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
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
