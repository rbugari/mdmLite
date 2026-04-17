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

function maskConnectionString(connectionString) {
  return connectionString.replace(/:\/\/([^:@]+):([^@]+)@/, "://$1:***@");
}

loadEnvFile(envPath);

ensure(fs.existsSync(envPath), ".env file not found in project root.");
ensure(process.env.DATABASE_URL, "DATABASE_URL is required.");
ensure(process.env.DATABASE_SSL_MODE, "DATABASE_SSL_MODE is required.");
ensure(process.env.APP_ADMIN_USERNAME, "APP_ADMIN_USERNAME is required.");
ensure(process.env.APP_ADMIN_EMAIL, "APP_ADMIN_EMAIL is required.");
ensure(process.env.APP_ADMIN_PASSWORD, "APP_ADMIN_PASSWORD is required.");
ensure(process.env.APP_AUTH_SECRET, "APP_AUTH_SECRET is required.");

const sslMode = process.env.DATABASE_SSL_MODE;
ensure(["disable", "require", "no-verify"].includes(sslMode), "DATABASE_SSL_MODE must be disable, require, or no-verify.");
ensure((process.env.APP_AUTH_SECRET ?? "").length >= 16, "APP_AUTH_SECRET must be at least 16 characters.");
ensure((process.env.APP_ADMIN_PASSWORD ?? "").length >= 1, "APP_ADMIN_PASSWORD must not be empty.");

const summary = {
  ok: true,
  envFile: envPath,
  appPort: process.env.APP_PORT ?? "3003",
  databaseSslMode: sslMode,
  databaseUrlMasked: maskConnectionString(process.env.DATABASE_URL),
  adminUsername: process.env.APP_ADMIN_USERNAME,
  adminEmail: process.env.APP_ADMIN_EMAIL,
};

console.log(JSON.stringify(summary, null, 2));