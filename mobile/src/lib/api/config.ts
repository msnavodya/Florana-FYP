// Wrap mobile API requests related to Config.
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const DEFAULT_BACKEND_PORT = 8000;
const FALLBACK_BACKEND_PORTS = [8000, 8001];
const ANDROID_EMULATOR_HOST = "10.0.2.2";
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", ANDROID_EMULATOR_HOST]);
const IS_PHYSICAL_ANDROID_DEVICE = Platform.OS === "android" && Boolean(Device.isDevice);

function isPrivateIpv4Address(host: string) {
  return /^(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)$/.test(host);
}

// Read the Expo host metadata so physical devices can discover the developer machine on the LAN.
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

const getExpoLanHost = () => {
  const host = getHostFromExpo();
  if (!host) {
    return null;
  }

  return isPrivateIpv4Address(host) ? host : null;
};

const getDefaultApiUrl = (port = DEFAULT_BACKEND_PORT) => {
  const expoLanHost = getExpoLanHost();
  if (expoLanHost) {
    return `http://${expoLanHost}:${port}`;
  }

  if (Platform.OS === "android" && !Device.isDevice) {
    return `http://${ANDROID_EMULATOR_HOST}:${port}`;
  }

  if (Platform.OS === "ios" && !Device.isDevice) {
    return `http://127.0.0.1:${port}`;
  }

  return `http://127.0.0.1:${port}`;
};

// Prefer an explicit env var, but repair loopback URLs when the app runs on a real Android device.
function resolveConfiguredApiUrl() {
  const rawConfiguredApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL;

  if (!rawConfiguredApiUrl) {
    return getDefaultApiUrl();
  }

  try {
    const parsed = new URL(rawConfiguredApiUrl);
    const hostname = parsed.hostname;
    const port = Number(parsed.port || DEFAULT_BACKEND_PORT);
    const expoLanHost = getExpoLanHost();

    if (IS_PHYSICAL_ANDROID_DEVICE) {
      if (LOOPBACK_HOSTS.has(hostname) && expoLanHost) {
        return `http://${expoLanHost}:${port}`;
      }

      if (!isPrivateIpv4Address(hostname) && expoLanHost) {
        return `http://${expoLanHost}:${port}`;
      }
    }

    return trimTrailingSlash(rawConfiguredApiUrl);
  } catch {
    return getDefaultApiUrl();
  }
}

const configuredApiUrl = trimTrailingSlash(resolveConfiguredApiUrl());
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
export const CONFIGURED_API_HOSTNAME = (() => {
  try {
    return new URL(configuredApiUrl).hostname;
  } catch {
    return null;
  }
})();
export const API_URL_REQUIRES_LAN_ON_DEVICE =
  IS_PHYSICAL_ANDROID_DEVICE && Boolean(CONFIGURED_API_HOSTNAME && LOOPBACK_HOSTS.has(CONFIGURED_API_HOSTNAME));

export const getApiUrl = () => activeApiUrl;

export const setApiUrl = (value: string) => {
  activeApiUrl = trimTrailingSlash(value);
};

export const getApiUrlCandidates = () => {
  // Build a small set of likely backend URLs so the client can recover from local host mismatches.
  const candidates: string[] = [];

  for (const variant of buildPortVariants(configuredApiUrl)) {
    addCandidate(candidates, variant);
  }

  const expoLanHost = getExpoLanHost();
  if (expoLanHost) {
    for (const port of FALLBACK_BACKEND_PORTS) {
      addCandidate(candidates, `http://${expoLanHost}:${port}`);
    }
  }

  if (Platform.OS === "android" && !Device.isDevice) {
    for (const port of FALLBACK_BACKEND_PORTS) {
      addCandidate(candidates, `http://${ANDROID_EMULATOR_HOST}:${port}`);
    }
  }

  if (Platform.OS !== "android" || !Device.isDevice) {
    for (const port of FALLBACK_BACKEND_PORTS) {
      addCandidate(candidates, `http://127.0.0.1:${port}`);
    }
  }

  return candidates;
};

export const buildApiUrl = (path = "") => {
  // Turn relative backend paths into absolute URLs while leaving fully qualified URLs untouched.
  const apiUrl = getApiUrl();

  if (!path) {
    return apiUrl;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const cleanPath = path.replace(/\\/g, "/");
  const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `${apiUrl}${normalizedPath}`;
};
