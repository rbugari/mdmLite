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

loadEnvFile(envPath);

const baseUrl = `http://localhost:${process.env.APP_PORT ?? "3003"}`;
const adminIdentifier = process.env.APP_ADMIN_USERNAME ?? process.env.APP_ADMIN_EMAIL;

if (!adminIdentifier || !process.env.APP_ADMIN_PASSWORD) {
  throw new Error("APP_ADMIN_USERNAME or APP_ADMIN_EMAIL, and APP_ADMIN_PASSWORD, are required.");
}

const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    identifier: adminIdentifier,
    password: process.env.APP_ADMIN_PASSWORD,
  }),
});

const cookie = loginResponse.headers.get("set-cookie")?.split(";")[0];

if (!loginResponse.ok || !cookie) {
  throw new Error(`Login failed: ${await loginResponse.text()}`);
}

const resetResponse = await fetch(`${baseUrl}/api/demo/reset`, {
  method: "POST",
  headers: { cookie },
});

const payload = await resetResponse.json();

if (!resetResponse.ok || !payload.ok) {
  throw new Error(`Demo reset endpoint failed: ${JSON.stringify(payload)}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      counts: payload.report?.validations?.counts ?? null,
    },
    null,
    2,
  ),
);