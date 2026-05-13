// Set up the Florana workspace for a fresh local clone.
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const args = new Set(process.argv.slice(2));
const skipJs = args.has("--skip-js");
const skipPython = args.has("--skip-python");

function log(message) {
  process.stdout.write(`${message}\n`);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function run(command, commandArgs, cwd = rootDir) {
  log(`\n> ${command} ${commandArgs.join(" ")}`);
  const commandLine = [command, ...commandArgs].join(" ");
  const result = isWindows && command.toLowerCase().endsWith(".cmd")
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", commandLine], {
        cwd,
        stdio: "inherit",
        shell: false,
      })
    : spawnSync(command, commandArgs, {
        cwd,
        stdio: "inherit",
        shell: false,
      });

  if (result.error) {
    fail(result.error.message);
  }

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
}

function commandWorks(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: rootDir,
    stdio: "ignore",
    shell: false,
  });

  return !result.error && result.status === 0;
}

function copyExampleIfMissing(examplePath, targetPath) {
  if (fs.existsSync(targetPath)) {
    log(`Kept existing ${path.relative(rootDir, targetPath)}.`);
    return;
  }

  fs.copyFileSync(examplePath, targetPath);
  log(`Created ${path.relative(rootDir, targetPath)} from its example file.`);
}

function resolvePythonLauncher() {
  const venvPython = path.join(rootDir, ".venv", isWindows ? "Scripts/python.exe" : "bin/python");
  if (fs.existsSync(venvPython)) {
    return { command: venvPython, args: [] };
  }

  const candidates = isWindows
    ? [
        { command: "py", args: ["-3"] },
        { command: "python", args: [] },
      ]
    : [
        { command: "python3", args: [] },
        { command: "python", args: [] },
      ];

  for (const candidate of candidates) {
    if (commandWorks(candidate.command, [...candidate.args, "--version"])) {
      return candidate;
    }
  }

  return null;
}

function ensureVirtualEnv() {
  const venvPython = path.join(rootDir, ".venv", isWindows ? "Scripts/python.exe" : "bin/python");
  if (fs.existsSync(venvPython)) {
    log("Reusing existing Python virtual environment in .venv.");
    return venvPython;
  }

  const launcher = resolvePythonLauncher();
  if (!launcher) {
    fail("Python 3 was not found. Install Python 3.10+ and run `npm run setup` again.");
  }

  run(launcher.command, [...launcher.args, "-m", "venv", ".venv"]);
  return venvPython;
}

function installJsDependencies() {
  const directories = [
    rootDir,
    path.join(rootDir, "mobile"),
    path.join(rootDir, "admin-dashboard"),
    path.join(rootDir, "florana"),
  ];

  for (const directory of directories) {
    run(npmCommand, ["install"], directory);
  }
}

function installPythonDependencies() {
  const pythonPath = ensureVirtualEnv();
  run(pythonPath, ["-m", "pip", "install", "--upgrade", "pip"]);
  run(pythonPath, ["-m", "pip", "install", "-r", "backend/requirements.txt"]);
}

copyExampleIfMissing(path.join(rootDir, "backend", ".env.example"), path.join(rootDir, "backend", ".env"));
copyExampleIfMissing(path.join(rootDir, "mobile", ".env.example"), path.join(rootDir, "mobile", ".env"));

if (!skipJs) {
  log("\nInstalling JavaScript dependencies for the repo, mobile app, admin dashboard, and legacy web client.");
  installJsDependencies();
}

if (!skipPython) {
  log("\nInstalling backend Python dependencies into .venv.");
  installPythonDependencies();
}

log("\nFlorana setup is complete.");
log("Next steps:");
log("1. Update backend/.env and mobile/.env if you need a different local API URL or payment keys.");
log("2. Run `npm run verify` to check the workspace.");
log("3. Start the backend with `npm run backend:start` and the mobile app with `npm start`.");
log("4. MongoDB is optional for a first run because the backend falls back to local JSON storage.");
