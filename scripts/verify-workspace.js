// Verify the main Florana modules that viewers need for a healthy local clone.
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const args = new Set(process.argv.slice(2));
const fullCheck = args.has("--full");

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function run(command, commandArgs, cwd = rootDir) {
  process.stdout.write(`\n> ${command} ${commandArgs.join(" ")}\n`);
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

function resolvePythonCommand() {
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

  fail("Python 3 was not found. Run `npm run setup` first or install Python 3.10+.");
}

function collectPythonFiles(currentDir, result = []) {
  const ignoredDirectories = new Set([".git", ".venv", "__pycache__", "node_modules"]);

  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        collectPythonFiles(fullPath, result);
      }
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".py")) {
      result.push(fullPath);
    }
  }

  return result;
}

function verifyPythonSyntax() {
  const python = resolvePythonCommand();
  const pythonFiles = [
    path.join(rootDir, "main.py"),
    ...collectPythonFiles(path.join(rootDir, "backend")),
    ...collectPythonFiles(path.join(rootDir, "ml_pipeline")),
  ].map((filePath) => path.relative(rootDir, filePath));

  run(python.command, [...python.args, "-m", "py_compile", ...pythonFiles]);
}

function runBackendPytest() {
  const python = resolvePythonCommand();
  run(python.command, [...python.args, "-m", "pytest", "backend/tests", "-q"]);
}

run(npmCommand, ["run", "mobile:typecheck"]);
run(npmCommand, ["run", "admin:build"]);
verifyPythonSyntax();
runBackendPytest();

if (fullCheck) {
  run(npmCommand, ["run", "legacy:web:build"]);
}

process.stdout.write("\nFlorana verification completed successfully.\n");
