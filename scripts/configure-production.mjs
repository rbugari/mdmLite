import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const envExamplePath = path.join(rootDir, ".env.example");

function parseEnvFile(raw) {
  const values = {};

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
    values[key] = value;
  }

  return values;
}

function loadEnvValues(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return parseEnvFile(fs.readFileSync(filePath, "utf8"));
}

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function maskConnectionString(connectionString) {
  return connectionString.replace(/:\/\/([^:@]+):([^@]+)@/, "://$1:***@");
}

function generateSecret() {
  return crypto.randomBytes(24).toString("hex");
}

async function promptWithDefault(rl, label, currentValue, options = {}) {
  const suffix = currentValue ? ` [${currentValue}]` : "";
  const answer = (await rl.question(`${label}${suffix}: `)).trim();

  if (!answer) {
    if (currentValue) {
      return currentValue;
    }

    if (options.required) {
      console.log(`[ERROR] ${label} es obligatorio.`);
      return promptWithDefault(rl, label, currentValue, options);
    }
  }

  const value = answer || currentValue || "";

  if (options.validate && !options.validate(value)) {
    console.log(`[ERROR] ${options.validationMessage ?? `Valor invalido para ${label}.`}`);
    return promptWithDefault(rl, label, currentValue, options);
  }

  return value;
}

async function promptPassword(rl, label, currentValue) {
  const suffix = currentValue ? " [Enter para mantener valor actual]" : "";
  const answer = (await rl.question(`${label}${suffix}: `)).trim();

  if (!answer && currentValue) {
    return currentValue;
  }

  if ((answer || currentValue || "").length < 8) {
    console.log(`[ERROR] ${label} debe tener al menos 8 caracteres.`);
    return promptPassword(rl, label, currentValue);
  }

  return answer || currentValue || "";
}

function buildEnvContent(values) {
  const orderedKeys = [
    "DATABASE_URL",
    "DATABASE_SSL_MODE",
    "APP_ADMIN_EMAIL",
    "APP_ADMIN_PASSWORD",
    "NEXT_PUBLIC_APP_NAME",
    "APP_PORT",
    "MCP_PORT",
    "WORKER_PORT",
    "MCP_ENABLED",
    "WORKER_ENABLED",
    "APP_AUTH_SECRET",
  ];

  return `${orderedKeys.map((key) => `${key}=${values[key] ?? ""}`).join("\n")}\n`;
}

const exampleValues = loadEnvValues(envExamplePath);
const currentValues = loadEnvValues(envPath);
const baseValues = { ...exampleValues, ...currentValues };

ensure(Object.keys(exampleValues).length > 0, ".env.example no existe o esta vacio.");

const rl = createInterface({ input, output });

try {
  console.log("[CONFIG] Configuracion inicial de MDM Lite para Windows");
  console.log("[CONFIG] Enter mantiene el valor actual o el default mostrado.");
  console.log("[CONFIG] APP_AUTH_SECRET se genera automaticamente si no existe.\n");

  baseValues.DATABASE_URL = await promptWithDefault(rl, "DATABASE_URL", baseValues.DATABASE_URL, {
    required: true,
    validate: (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
    validationMessage: "Debe comenzar con postgresql:// o postgres://",
  });

  baseValues.DATABASE_SSL_MODE = await promptWithDefault(rl, "DATABASE_SSL_MODE (disable|require|no-verify)", baseValues.DATABASE_SSL_MODE, {
    required: true,
    validate: (value) => ["disable", "require", "no-verify"].includes(value),
    validationMessage: "Debe ser disable, require o no-verify.",
  });

  baseValues.APP_ADMIN_USERNAME = await promptWithDefault(rl, "APP_ADMIN_USERNAME", baseValues.APP_ADMIN_USERNAME || "admin", {
    required: true,
  });

  baseValues.APP_ADMIN_EMAIL = await promptWithDefault(rl, "APP_ADMIN_EMAIL (email interno del admin en la app)", baseValues.APP_ADMIN_EMAIL, {
    required: true,
    validate: (value) => value.includes("@"),
    validationMessage: "Debe ser un email valido.",
  });

  baseValues.APP_ADMIN_PASSWORD = await promptPassword(rl, "APP_ADMIN_PASSWORD", currentValues.APP_ADMIN_PASSWORD);
  baseValues.NEXT_PUBLIC_APP_NAME = await promptWithDefault(rl, "NEXT_PUBLIC_APP_NAME", baseValues.NEXT_PUBLIC_APP_NAME || "MDM Lite", {
    required: true,
  });
  baseValues.APP_PORT = await promptWithDefault(rl, "APP_PORT", baseValues.APP_PORT || "3003", {
    required: true,
    validate: (value) => /^\d+$/.test(value),
    validationMessage: "Debe ser un puerto numerico.",
  });

  baseValues.MCP_PORT = baseValues.MCP_PORT || "3103";
  baseValues.WORKER_PORT = baseValues.WORKER_PORT || "3203";
  baseValues.MCP_ENABLED = baseValues.MCP_ENABLED || "0";
  baseValues.WORKER_ENABLED = baseValues.WORKER_ENABLED || "0";
  baseValues.APP_AUTH_SECRET = currentValues.APP_AUTH_SECRET || generateSecret();

  ensure(baseValues.APP_AUTH_SECRET.length >= 16, "APP_AUTH_SECRET debe tener al menos 16 caracteres.");

  fs.writeFileSync(envPath, buildEnvContent(baseValues), "utf8");

  console.log("\n[OK] Archivo .env generado o actualizado.");
  console.log(`[INFO] DATABASE_URL=${maskConnectionString(baseValues.DATABASE_URL)}`);
  console.log(`[INFO] DATABASE_SSL_MODE=${baseValues.DATABASE_SSL_MODE}`);
  console.log(`[INFO] APP_ADMIN_USERNAME=${baseValues.APP_ADMIN_USERNAME}`);
  console.log(`[INFO] APP_ADMIN_EMAIL=${baseValues.APP_ADMIN_EMAIL}`);
  console.log(`[INFO] APP_PORT=${baseValues.APP_PORT}`);
  console.log(`[INFO] APP_AUTH_SECRET generado=${currentValues.APP_AUTH_SECRET ? "no" : "si"}`);
} finally {
  rl.close();
}