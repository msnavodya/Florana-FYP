// Run the mobile development helper script for Start Expo.
const net = require("net");
const os = require("os");
const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");
const { spawn } = require("child_process");

const argv = process.argv.slice(2);
const preferredPorts = [8081, 8082, 8083, 8084, 8085, 8090, 8091];
const preferredBackendPorts = [8000, 8001, 8002, 8003];
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "10.0.2.2"]);

function readLocalEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return {};
  }

  return fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .reduce((result, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return result;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        return result;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      result[key] = value;
      return result;
    }, {});
}

function getConfiguredApiUrl() {
  const localEnv = readLocalEnv();
  return process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL || localEnv.EXPO_PUBLIC_API_BASE_URL || localEnv.EXPO_PUBLIC_API_URL;
}

function isPrivateIpv4Address(host) {
  return /^(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)$/.test(host);
}

function getLanHost() {
  const interfaces = os.networkInterfaces();

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry && entry.family === "IPv4" && !entry.internal && isPrivateIpv4Address(entry.address)) {
        return entry.address;
      }
    }
  }

  return null;
}

function resolveBackendPort() {
  const explicitUrl = getConfiguredApiUrl();
  if (!explicitUrl) {
    return 8000;
  }

  try {
    return Number(new URL(explicitUrl).port || 8000);
  } catch {
    return 8000;
  }
}

const backendPort = resolveBackendPort();
const configuredApiUrl = getConfiguredApiUrl();
const lanHost = getLanHost();

function buildSessionApiUrl(port) {
  if (configuredApiUrl) {
    try {
      const parsed = new URL(configuredApiUrl);
      const protocol = parsed.protocol || "http:";

      if (lanHost && (LOOPBACK_HOSTS.has(parsed.hostname) || isPrivateIpv4Address(parsed.hostname))) {
        return `${protocol}//${lanHost}:${port}`;
      }

      return `${protocol}//${parsed.hostname}:${port}`;
    } catch {
      // Fall back to the detected LAN host or loopback.
    }
  }

  if (lanHost) {
    return `http://${lanHost}:${port}`;
  }

  return `http://127.0.0.1:${port}`;
}

function canConnect(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(1500);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

function requestJson(url, timeoutMs = 2500) {
  return new Promise((resolve) => {
    let completed = false;

    const finish = (result) => {
      if (!completed) {
        completed = true;
        resolve(result);
      }
    };

    try {
      const client = url.startsWith("https:") ? https : http;
      const request = client.get(url, (response) => {
        let body = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          let parsedBody = null;

          try {
            parsedBody = body ? JSON.parse(body) : null;
          } catch {
            parsedBody = null;
          }

          finish({
            ok: response.statusCode >= 200 && response.statusCode < 300,
            statusCode: response.statusCode || 0,
            body: parsedBody,
            rawBody: body,
          });
        });
      });

      request.setTimeout(timeoutMs, () => {
        request.destroy(new Error("timeout"));
      });
      request.on("error", (error) => {
        finish({
          ok: false,
          statusCode: 0,
          body: null,
          rawBody: "",
          error: error.message,
        });
      });
    } catch (error) {
      finish({
        ok: false,
        statusCode: 0,
        body: null,
        rawBody: "",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

function isCompatibleFloranaBackend(body) {
  return Boolean(
    body &&
      body.server === "Florana Backend" &&
      body.ai_model &&
      typeof body.ai_model.loaded === "boolean" &&
      typeof body.ai_model.status === "string"
  );
}

async function inspectBackend(port) {
  const localUrl = `http://127.0.0.1:${port}/health`;
  const response = await requestJson(localUrl);

  if (!response.ok) {
    return {
      reachable: false,
      compatible: false,
      reason: response.error || `Health check failed with status ${response.statusCode || "unknown"}`,
    };
  }

  return {
    reachable: true,
    compatible: isCompatibleFloranaBackend(response.body),
    reason: isCompatibleFloranaBackend(response.body)
      ? null
      : "Another service responded on this port, but it is not a compatible Florana backend.",
    health: response.body,
  };
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, "0.0.0.0");
  });
}

async function findFreeBackendPort(initialPort) {
  const candidates = [initialPort, ...preferredBackendPorts];
  const tried = new Set();

  for (const port of candidates) {
    if (tried.has(port)) {
      continue;
    }

    tried.add(port);
    if (await isPortFree(port)) {
      return port;
    }
  }

  throw new Error("No free backend port found in the preferred range.");
}

async function findFreePort() {
  for (const port of preferredPorts) {
    if (await isPortFree(port)) {
      return port;
    }
  }

  throw new Error("No free Expo port found in the preferred range.");
}

function startBackendIfNeeded(port) {
  const backendRoot = path.resolve(process.cwd(), "..");
  const pythonPath =
    process.platform === "win32"
      ? path.join(backendRoot, ".venv", "Scripts", "python.exe")
      : path.join(backendRoot, ".venv", "bin", "python");

  const child = spawn(
    pythonPath,
    ["backend/run_backend.py", "--host", "0.0.0.0", "--port", String(port)],
    {
      cwd: backendRoot,
      env: {
        ...process.env,
        HOST: "0.0.0.0",
        PORT: String(port),
      },
      stdio: "inherit",
      shell: false,
    }
  );

  child.on("error", (error) => {
    console.error(`Unable to start FastAPI backend: ${error.message}`);
  });

  return child;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForCompatibleBackend(port, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const status = await inspectBackend(port);
    if (status.compatible) {
      return status;
    }

    await sleep(1000);
  }

  return inspectBackend(port);
}

async function main() {
  let backendChild = null;

  if (configuredApiUrl) {
    console.log(`Configured mobile API base URL: ${configuredApiUrl}`);
  } else {
    console.log(
      `Mobile API base URL not set. Expo Go on a phone should use your LAN IP, for example ${buildSessionApiUrl(backendPort)}.`
    );
  }

  let activeBackendPort = backendPort;
  const backendStatus = await inspectBackend(backendPort);

  if (backendStatus.compatible) {
    console.log(`Compatible Florana backend already running on port ${backendPort}.`);
  } else {
    if (backendStatus.reachable) {
      console.log(`Port ${backendPort} is already in use by an incompatible or stale backend.`);
      console.log(`Reason: ${backendStatus.reason}`);
      activeBackendPort = await findFreeBackendPort(backendPort + 1);
    } else if (await canConnect(backendPort)) {
      console.log(`Port ${backendPort} accepted a TCP connection but did not pass Florana health validation.`);
      activeBackendPort = await findFreeBackendPort(backendPort + 1);
    }

    console.log(`Starting Florana backend on port ${activeBackendPort}...`);
    backendChild = startBackendIfNeeded(activeBackendPort);

    const startedBackend = await waitForCompatibleBackend(activeBackendPort);
    if (!startedBackend.compatible) {
      throw new Error(`Florana backend did not become healthy on port ${activeBackendPort}. ${startedBackend.reason || ""}`.trim());
    }
  }

  const sessionApiUrl = buildSessionApiUrl(activeBackendPort);
  console.log(`Using mobile API base URL for this Expo session: ${sessionApiUrl}`);

  const port = await findFreePort();
  console.log(`Starting Expo on port ${port}...`);
  const hasExplicitHostMode = argv.some((arg) => arg === "--lan" || arg === "--tunnel" || arg === "--localhost");
  const hostModeArgs = hasExplicitHostMode ? "" : " --lan";
  const expoCommand = `npx expo start${hostModeArgs} --port ${port}${argv.length ? ` ${argv.join(" ")}` : ""}`;

  const child =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", expoCommand], {
          cwd: process.cwd(),
          env: {
            ...process.env,
            EXPO_PUBLIC_API_BASE_URL: sessionApiUrl,
            EXPO_PUBLIC_API_URL: sessionApiUrl,
          },
          stdio: "inherit",
          shell: false,
        })
      : spawn("sh", ["-lc", expoCommand], {
          cwd: process.cwd(),
          env: {
            ...process.env,
            EXPO_PUBLIC_API_BASE_URL: sessionApiUrl,
            EXPO_PUBLIC_API_URL: sessionApiUrl,
          },
          stdio: "inherit",
          shell: false,
        });

  child.on("exit", (code) => {
    if (backendChild && !backendChild.killed) {
      backendChild.kill();
    }
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
