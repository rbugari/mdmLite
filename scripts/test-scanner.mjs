import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

function loadEnv(pathToEnv) {
  const txt = fs.readFileSync(pathToEnv, "utf8");
  const env = {};

  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) {
      env[m[1]] = m[2];
    }
  }

  return env;
}

function runNpmScript(scriptName) {
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const startedAt = Date.now();

  return new Promise((resolve) => {
    const child =
      process.platform === "win32"
        ? spawn("cmd.exe", ["/d", "/s", "/c", `${npmCmd} run ${scriptName}`], {
            stdio: "inherit",
            cwd: process.cwd(),
          })
        : spawn(npmCmd, ["run", scriptName], {
            stdio: "inherit",
            cwd: process.cwd(),
          });

    child.on("close", (code) => {
      resolve({
        script: scriptName,
        code: code ?? 1,
        ok: (code ?? 1) === 0,
        durationMs: Date.now() - startedAt,
      });
    });

    child.on("error", (error) => {
      resolve({
        script: scriptName,
        code: 1,
        ok: false,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "Unknown spawn error",
      });
    });
  });
}

async function ensureServerReachable(baseUrl) {
  const response = await fetch(`${baseUrl}/api/health/db`, { method: "GET" });
  if (!response.ok) {
    throw new Error(`health endpoint returned ${response.status}`);
  }

  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(`health payload not ok: ${JSON.stringify(payload)}`);
  }
}

function formatDuration(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

const env = loadEnv(path.join(process.cwd(), ".env"));
const appPort = env.APP_PORT || "3003";
const baseUrl = env.APP_BASE_URL || `http://localhost:${appPort}`;

const suite = ["typecheck", "e2e:nondestructive", "e2e:client-asset", "e2e:ui-workflows"];
const startedAt = Date.now();

console.log(`scanner_base_url=${baseUrl}`);

let serverOk = true;
let serverError = null;

try {
  await ensureServerReachable(baseUrl);
  console.log("scanner_server_check=ok");
} catch (error) {
  serverOk = false;
  serverError = error instanceof Error ? error.message : "Unknown server check error";
  console.error(`scanner_server_check=fail (${serverError})`);
}

const stepResults = [];

if (serverOk) {
  for (const step of suite) {
    console.log(`scanner_step_start=${step}`);
    const result = await runNpmScript(step);
    stepResults.push(result);
    console.log(`scanner_step_end=${step} ok=${String(result.ok)} duration=${formatDuration(result.durationMs)}`);

    if (!result.ok) {
      break;
    }
  }
}

const totalDurationMs = Date.now() - startedAt;
const allStepsOk = serverOk && stepResults.length === suite.length && stepResults.every((x) => x.ok);

const report = {
  generatedAt: new Date().toISOString(),
  overall: allStepsOk ? "GO" : "NO_GO",
  baseUrl,
  server: {
    ok: serverOk,
    error: serverError,
  },
  totalDurationMs,
  steps: stepResults,
};

const reportsDir = path.join(process.cwd(), "reports");
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const reportPath = path.join(reportsDir, "test-scan-latest.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

console.log("scanner_report_path=reports/test-scan-latest.json");
console.log(`scanner_overall=${report.overall}`);

if (!allStepsOk) {
  process.exit(1);
}
