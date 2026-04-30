import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const { Client } = pg;

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

function getSslConfig() {
  const sslMode = process.env.DATABASE_SSL_MODE ?? "require";

  if (sslMode === "disable") {
    return undefined;
  }

  if (sslMode === "no-verify") {
    return {
      rejectUnauthorized: false,
    };
  }

  return {
    rejectUnauthorized: true,
  };
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

const connectionString = process.env.DATABASE_URL;
const sslMode = process.env.DATABASE_SSL_MODE;
const parsedUrl = new URL(connectionString);

const client = new Client({
  connectionString,
  ssl: getSslConfig(),
  connectionTimeoutMillis: 10000,
});

try {
  const startedAt = Date.now();
  await client.connect();
  const result = await client.query(`
    select
      current_database() as database_name,
      current_user as database_user,
      inet_server_addr()::text as server_ip,
      inet_server_port() as server_port,
      now()::text as server_time
  `);

  console.log(
    JSON.stringify(
      {
        ok: true,
        latencyMs: Date.now() - startedAt,
        databaseUrlMasked: maskConnectionString(connectionString),
        databaseHost: parsedUrl.hostname,
        databasePort: parsedUrl.port || "5432",
        databaseName: result.rows[0]?.database_name ?? parsedUrl.pathname.replace(/^\//, ""),
        databaseUser: result.rows[0]?.database_user ?? parsedUrl.username,
        databaseSslMode: sslMode,
        serverIp: result.rows[0]?.server_ip ?? null,
        serverPort: result.rows[0]?.server_port ?? null,
        serverTime: result.rows[0]?.server_time ?? null,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error("PostgreSQL connectivity check failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}