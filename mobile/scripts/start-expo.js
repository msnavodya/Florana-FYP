const net = require("net");
const path = require("path");
const { spawn } = require("child_process");

const argv = process.argv.slice(2);
const preferredPorts = [8081, 8082, 8083, 8084, 8085, 8090, 8091];
const backendPort = 8000;

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

async function findFreePort() {
  for (const port of preferredPorts) {
    if (await isPortFree(port)) {
      return port;
    }
  }

  throw new Error("No free Expo port found in the preferred range.");
}

function startBackendIfNeeded() {
  const backendRoot = path.resolve(process.cwd(), "..");
  const pythonPath =
    process.platform === "win32"
      ? path.join(backendRoot, ".venv", "Scripts", "python.exe")
      : path.join(backendRoot, ".venv", "bin", "python");

  const child = spawn(
    pythonPath,
    ["-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", String(backendPort)],
    {
      cwd: backendRoot,
      stdio: "inherit",
      shell: false,
    }
  );

  child.on("error", (error) => {
    console.error(`Unable to start FastAPI backend: ${error.message}`);
  });

  return child;
}

async function main() {
  let backendChild = null;
  const backendRunning = await canConnect(backendPort);
  if (backendRunning) {
    console.log(`FastAPI backend already running on port ${backendPort}.`);
  } else {
    console.log(`Starting FastAPI backend on port ${backendPort}...`);
    backendChild = startBackendIfNeeded();
  }

  const port = await findFreePort();
  console.log(`Starting Expo on port ${port}...`);
  const expoCommand = `npx expo start --tunnel --port ${port}${argv.length ? ` ${argv.join(" ")}` : ""}`;

  const child =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", expoCommand], {
          cwd: process.cwd(),
          stdio: "inherit",
          shell: false,
        })
      : spawn("sh", ["-lc", expoCommand], {
          cwd: process.cwd(),
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
