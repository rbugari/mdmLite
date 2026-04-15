import fs from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";
import xlsx from "xlsx";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const workbookPath = path.join(rootDir, "data", "demo", "input_mvp_ventas_perseida_v2.xlsx");
const defaultValidFrom = "2024-01-01";

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

function toBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    return ["1", "true", "yes", "si", "sí", "activo"].includes(value.trim().toLowerCase());
  }

  return false;
}

function readSheet(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error(`Sheet not found: ${sheetName}`);
  }

  return xlsx.utils.sheet_to_json(sheet, {
    defval: null,
    raw: false,
    blankrows: false,
    trim: true,
  });
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

loadEnvFile(envPath);

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not configured.");
  process.exit(1);
}

if (!fs.existsSync(workbookPath)) {
  console.error(`Workbook not found: ${workbookPath}`);
  process.exit(1);
}

const workbook = xlsx.readFile(workbookPath);
const mappingRows = readSheet(workbook, "mdm_clientes_equivalencia");
const groupingRows = readSheet(workbook, "mdm_clientes_agrupacion");
const parameterRows = readSheet(workbook, "mdm_parametros_pvp");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: getSslConfig(),
});

try {
  await client.connect();
  await client.query("begin");

  const adminResult = await client.query("select id from mdm_user where email = $1 limit 1", [
    process.env.APP_ADMIN_EMAIL ?? "admin@mdmlite.local",
  ]);

  if (adminResult.rowCount === 0) {
    throw new Error("Admin user not found. Run schema apply first.");
  }

  const adminId = adminResult.rows[0].id;

  const entityTypeResult = await client.query("select id from mdm_entity_type where code = 'CLIENT' limit 1");
  const clientEntityTypeId = entityTypeResult.rows[0]?.id;

  if (!clientEntityTypeId) {
    throw new Error("Entity type CLIENT not found.");
  }

  const ruleSetResult = await client.query(
    "select code, id from mdm_rule_set where code = any($1::text[])",
    [["ventas_perseida_clientes", "ventas_perseida_tarifas"]],
  );

  const ruleSetMap = new Map(ruleSetResult.rows.map((row) => [row.code, row.id]));
  const clientRuleSetId = ruleSetMap.get("ventas_perseida_clientes");
  const parameterRuleSetId = ruleSetMap.get("ventas_perseida_tarifas");

  if (!clientRuleSetId || !parameterRuleSetId) {
    throw new Error("Required rule sets not found.");
  }

  for (const row of mappingRows) {
    if (!row.source_value || !row.target_value) {
      continue;
    }

    await client.query(
      `
        insert into mdm_mapping_rule (
          id,
          rule_set_id,
          entity_type_id,
          source_key,
          source_value,
          target_value,
          target_label,
          priority,
          valid_from,
          status,
          is_active,
          comments,
          created_by,
          updated_by
        )
        values ($1, $2, $3, $4, $5, $6, $7, 100, $8, 'approved', $9, $10, $11, $11)
        on conflict (rule_set_id, entity_type_id, source_key, source_value, valid_from)
        do update set
          target_value = excluded.target_value,
          target_label = excluded.target_label,
          status = excluded.status,
          is_active = excluded.is_active,
          comments = excluded.comments,
          updated_by = excluded.updated_by,
          updated_at = current_timestamp
      `,
      [
        randomUUID(),
        clientRuleSetId,
        clientEntityTypeId,
        "customer_name",
        String(row.source_value).trim(),
        String(row.target_value).trim(),
        String(row.target_value).trim(),
        defaultValidFrom,
        row.activo === null ? true : toBoolean(row.activo),
        "Imported from input_mvp_ventas_perseida_v2.xlsx",
        adminId,
      ],
    );
  }

  for (const row of groupingRows) {
    if (!row.cliente || !row.grupo_cliente) {
      continue;
    }

    await client.query(
      `
        insert into mdm_group_rule (
          id,
          rule_set_id,
          entity_type_id,
          member_value,
          group_value,
          group_label,
          valid_from,
          status,
          is_active,
          comments,
          created_by,
          updated_by
        )
        values ($1, $2, $3, $4, $5, $6, $7, 'approved', true, $8, $9, $9)
        on conflict (rule_set_id, entity_type_id, member_value, valid_from)
        do update set
          group_value = excluded.group_value,
          group_label = excluded.group_label,
          status = excluded.status,
          is_active = excluded.is_active,
          comments = excluded.comments,
          updated_by = excluded.updated_by,
          updated_at = current_timestamp
      `,
      [
        randomUUID(),
        clientRuleSetId,
        clientEntityTypeId,
        String(row.cliente).trim(),
        String(row.grupo_cliente).trim(),
        String(row.grupo_cliente).trim(),
        defaultValidFrom,
        "Imported from input_mvp_ventas_perseida_v2.xlsx",
        adminId,
      ],
    );
  }

  for (const row of parameterRows) {
    if (!row.cliente || row.factor === null || row.factor === undefined || row.factor === "") {
      continue;
    }

    await client.query(
      `
        insert into mdm_parameter (
          id,
          parameter_key,
          parameter_value,
          data_type,
          domain,
          parameter_scope_type,
          parameter_scope_value,
          valid_from,
          status,
          is_active,
          description,
          created_by,
          updated_by
        )
        values ($1, $2, $3, 'numeric', $4, 'CLIENT', $5, $6, 'approved', true, $7, $8, $8)
        on conflict (parameter_key, domain, parameter_scope_type, parameter_scope_value, valid_from)
        do update set
          parameter_value = excluded.parameter_value,
          status = excluded.status,
          is_active = excluded.is_active,
          description = excluded.description,
          updated_by = excluded.updated_by,
          updated_at = current_timestamp
      `,
      [
        randomUUID(),
        "PVP_FACTOR",
        String(row.factor).trim(),
        "ventas_perseida",
        String(row.cliente).trim(),
        defaultValidFrom,
        "Imported from input_mvp_ventas_perseida_v2.xlsx",
        adminId,
      ],
    );
  }

  await client.query("commit");
  console.log(
    `Demo data imported successfully. mappings=${mappingRows.length}, groups=${groupingRows.length}, parameters=${parameterRows.length}`,
  );
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  console.error("Failed to import demo data.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
