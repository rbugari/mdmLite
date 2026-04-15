import fs from "node:fs";
import path from "node:path";
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

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

loadEnvFile(envPath);

const baseUrl = `http://127.0.0.1:${process.env.APP_PORT ?? "3003"}`;

const rootResponse = await fetch(baseUrl, {
  redirect: "manual",
});

ensure(rootResponse.ok || rootResponse.status === 307, `Unexpected root status: ${rootResponse.status}`);

const dbResponse = await fetch(`${baseUrl}/api/health/db`);
const dbPayload = await dbResponse.json().catch(() => null);

ensure(
  dbResponse.ok,
  `Database health endpoint returned ${dbResponse.status}: ${dbPayload?.error ?? "unknown error"}`,
);
ensure(dbPayload.ok === true, `Database health reported failure: ${dbPayload.error ?? "unknown error"}`);

console.log(
  JSON.stringify(
    {
      ok: true,
      baseUrl,
      checks: {
        rootStatus: rootResponse.status,
        dbStatus: dbResponse.status,
        sslMode: dbPayload.sslMode ?? null,
      },
    },
    null,
    2,
  ),
);