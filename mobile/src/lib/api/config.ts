import Constants from "expo-constants";
import { Platform } from "react-native";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const DEFAULT_BACKEND_PORT = 8000;
const FALLBACK_BACKEND_PORTS = [8000, 8001];

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

const getDefaultApiUrl = (port = DEFAULT_BACKEND_PORT) => {
  if (Platform.OS === "android") {
    return `http://10.0.2.2:${port}`;
  }

  const expoHost = getHostFromExpo();
  if (expoHost) {
    return `http://${expoHost}:${port}`;
  }

  return `http://127.0.0.1:${port}`;
};

const configuredApiUrl = trimTrailingSlash(process.env.EXPO_PUBLIC_API_URL || getDefaultApiUrl());
let activeApiUrl = configuredApiUrl;

function addCandidate(candidates: string[], value: string | null | undefined) {
  if (!value) {
    return;
  }

  const normalized = trimTrailingSlash(value);
  if (!candidates.includes(normalized)) {
    candidates.push(normalized);
  }
}

function buildPortVariants(url: string) {
  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol || "http:";
    const hostname = parsed.hostname;
    const explicitPort = Number(parsed.port || DEFAULT_BACKEND_PORT);
    const ports = [explicitPort, ...FALLBACK_BACKEND_PORTS.filter((port) => port !== explicitPort)];

    return ports.map((port) => `${protocol}//${hostname}:${port}`);
  } catch {
    return [url];
  }
}

export const API_URL = configuredApiUrl;

export const getApiUrl = () => activeApiUrl;

export const setApiUrl = (value: string) => {
  activeApiUrl = trimTrailingSlash(value);
};

export const getApiUrlCandidates = () => {
  const candidates: string[] = [];

  for (const variant of buildPortVariants(configuredApiUrl)) {
    addCandidate(candidates, variant);
  }

  const expoHost = getHostFromExpo();
  if (expoHost) {
    for (const port of FALLBACK_BACKEND_PORTS) {
      addCandidate(candidates, `http://${expoHost}:${port}`);
    }
  }

  for (const port of FALLBACK_BACKEND_PORTS) {
    addCandidate(candidates, getDefaultApiUrl(port));
  }

  return candidates;
};

export const buildApiUrl = (path = "") => {
  const apiUrl = getApiUrl();

  if (!path) {
    return apiUrl;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiUrl}${normalizedPath}`;
};
