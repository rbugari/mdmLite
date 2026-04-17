import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(envPath);

const command = process.argv[2];
const port = process.env.APP_PORT ?? "3003";
const nextBin = path.join(rootDir, "node_modules", ".bin", process.platform === "win32" ? "next.cmd" : "next");
const standaloneServer = path.join(rootDir, ".next", "standalone", "server.js");

if (!command || !["dev", "start"].includes(command)) {
  console.error("Usage: node scripts/run-next.mjs <dev|start>");
  process.exit(1);
}

if (!fs.existsSync(nextBin)) {
  console.error("Next.js executable not found. Run npm install first.");
  process.exit(1);
}

if (command === "start" && !fs.existsSync(standaloneServer)) {
  console.error("Standalone server not found. Run npm run build first and confirm .next/standalone/server.js exists.");
  process.exit(1);
}

const child =
  command === "start"
    ? spawn(process.execPath, [standaloneServer], {
        cwd: rootDir,
        stdio: "inherit",
        env: {
          ...process.env,
          PORT: port,
        },
      })
    : process.platform === "win32"
      ? spawn("cmd.exe", ["/c", nextBin, command, "-p", port], {
          cwd: rootDir,
          stdio: "inherit",
          env: process.env,
        })
      : spawn(nextBin, [command, "-p", port], {
        cwd: rootDir,
        stdio: "inherit",
        env: process.env,
      });

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
