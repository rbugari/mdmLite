import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const reportsDir = path.join(rootDir, "reports");
const reportPath = path.join(reportsDir, "remote-foundation-validation-latest.json");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
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

function ensureReportsDir() {
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
}

function runNodeScript(scriptPath) {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: rootDir,
    stdio: "pipe",
    encoding: "utf8",
    env: process.env,
  });

  return {
    ok: result.status === 0,
    code: result.status ?? 1,
    stdout: result.stdout?.trim() ?? "",
    stderr: result.stderr?.trim() ?? "",
  };
}

async function isAppReachable(baseUrl) {
  try {
    const response = await fetch(baseUrl, { redirect: "manual" });
    return response.ok || response.status === 307;
  } catch {
    return false;
  }
}

function summarizeStep(name, result, required = true) {
  return {
    name,
    required,
    ok: result.ok,
    code: result.code,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

loadEnvFile(envPath);
ensureReportsDir();

const baseUrl = `http://127.0.0.1:${process.env.APP_PORT ?? "3003"}`;
const steps = [];

const envCheck = runNodeScript(path.join(__dirname, "validate-runtime-env.mjs"));
steps.push(summarizeStep("env:check", envCheck));

if (!envCheck.ok) {
  const report = {
    generatedAt: new Date().toISOString(),
    overall: "NO_GO",
    baseUrl,
    appReachable: false,
    steps,
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.error(`[NO_GO] env:check failed. Report: ${reportPath}`);
  process.exit(1);
}

const dbApply = runNodeScript(path.join(__dirname, "apply-schema.mjs"));
steps.push(summarizeStep("db:apply", dbApply));

if (!dbApply.ok) {
  const report = {
    generatedAt: new Date().toISOString(),
    overall: "NO_GO",
    baseUrl,
    appReachable: false,
    steps,
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.error(`[NO_GO] db:apply failed. Report: ${reportPath}`);
  process.exit(1);
}

const demoReset = runNodeScript(path.join(__dirname, "demo-reset-seed.mjs"));
steps.push(summarizeStep("demo:reset", demoReset));

if (!demoReset.ok) {
  const report = {
    generatedAt: new Date().toISOString(),
    overall: "NO_GO",
    baseUrl,
    appReachable: false,
    steps,
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.error(`[NO_GO] demo:reset failed. Report: ${reportPath}`);
  process.exit(1);
}

const appReachable = await isAppReachable(baseUrl);

if (appReachable) {
  const smokeProd = runNodeScript(path.join(__dirname, "smoke-production.mjs"));
  steps.push(summarizeStep("smoke:prod", smokeProd));

  const demoEndpoint = runNodeScript(path.join(__dirname, "check-demo-reset-endpoint.mjs"));
  steps.push(summarizeStep("demo:reset:endpoint", demoEndpoint));
} else {
  steps.push({
    name: "smoke:prod",
    required: false,
    ok: true,
    code: 0,
    stdout: `Skipped because app is not reachable at ${baseUrl}.`,
    stderr: "",
  });
  steps.push({
    name: "demo:reset:endpoint",
    required: false,
    ok: true,
    code: 0,
    stdout: `Skipped because app is not reachable at ${baseUrl}.`,
    stderr: "",
  });
}

const overall = steps.every((step) => !step.required || step.ok) ? "GO" : "NO_GO";

const report = {
  generatedAt: new Date().toISOString(),
  overall,
  baseUrl,
  appReachable,
  steps,
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`remote_foundation_overall=${overall}`);
console.log(`remote_foundation_base_url=${baseUrl}`);
console.log(`remote_foundation_app_reachable=${appReachable ? "yes" : "no"}`);
console.log(`remote_foundation_report=${reportPath}`);

if (overall !== "GO") {
  process.exit(1);
}