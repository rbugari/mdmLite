import * as xlsx from "xlsx";

import { query } from "@/lib/db";

const defaultValidFrom = "2024-01-01";

type UploadTarget = "mappings" | "groups" | "parameters";

type ImportContext = {
  adminId: string;
  clientEntityTypeId: string;
  clientRuleSetId: string;
};

function toBoolean(value: unknown) {
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

async function getImportContext(): Promise<ImportContext> {
  const adminResult = await query<{ id: string }>("select id from mdm_user where email = $1 limit 1", [
    process.env.APP_ADMIN_EMAIL ?? "admin@mdmlite.local",
  ]);

  if (adminResult.rowCount === 0) {
    throw new Error("Admin user not found. Run db:apply first.");
  }

  const entityTypeResult = await query<{ id: string }>("select id from mdm_entity_type where code = 'CLIENT' limit 1");
  if (entityTypeResult.rowCount === 0) {
    throw new Error("Entity type CLIENT not found.");
  }

  const ruleSetResult = await query<{ id: string }>(
    "select id from mdm_rule_set where code = 'ventas_perseida_clientes' limit 1",
  );
  if (ruleSetResult.rowCount === 0) {
    throw new Error("Rule set ventas_perseida_clientes not found.");
  }

  return {
    adminId: adminResult.rows[0].id,
    clientEntityTypeId: entityTypeResult.rows[0].id,
    clientRuleSetId: ruleSetResult.rows[0].id,
  };
}

function firstSheetRowsFromBuffer(buffer: Buffer) {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("Workbook does not contain sheets.");
  }

  return xlsx.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
    defval: null,
    raw: false,
    blankrows: false,
  });
}

function sheetRowsFromBuffer(buffer: Buffer, sheetName: string) {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error(`Sheet not found: ${sheetName}`);
  }

  return xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false,
    blankrows: false,
  });
}

export async function importMappingRows(rows: Record<string, unknown>[]) {
  const context = await getImportContext();
  let imported = 0;

  for (const row of rows) {
    if (!row.source_value || !row.target_value) {
      continue;
    }

    await query(
      `
        insert into mdm_mapping_rule (
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
        values ($1, $2, $3, $4, $5, $6, 100, $7, 'approved', $8, $9, $10, $10)
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
        context.clientRuleSetId,
        context.clientEntityTypeId,
        "customer_name",
        String(row.source_value).trim(),
        String(row.target_value).trim(),
        String(row.target_value).trim(),
        defaultValidFrom,
        row.activo === null ? true : toBoolean(row.activo),
        "Imported from UI or demo file",
        context.adminId,
      ],
    );

    imported += 1;
  }

  return imported;
}

export async function importGroupRows(rows: Record<string, unknown>[]) {
  const context = await getImportContext();
  let imported = 0;

  for (const row of rows) {
    if (!row.cliente || !row.grupo_cliente) {
      continue;
    }

    await query(
      `
        insert into mdm_group_rule (
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
        values ($1, $2, $3, $4, $5, $6, 'approved', true, $7, $8, $8)
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
        context.clientRuleSetId,
        context.clientEntityTypeId,
        String(row.cliente).trim(),
        String(row.grupo_cliente).trim(),
        String(row.grupo_cliente).trim(),
        defaultValidFrom,
        "Imported from UI or demo file",
        context.adminId,
      ],
    );

    imported += 1;
  }

  return imported;
}

export async function importParameterRows(rows: Record<string, unknown>[]) {
  const context = await getImportContext();
  let imported = 0;

  for (const row of rows) {
    if (!row.cliente || row.factor === null || row.factor === undefined || row.factor === "") {
      continue;
    }

    await query(
      `
        insert into mdm_parameter (
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
        values ($1, $2, 'numeric', $3, 'CLIENT', $4, $5, 'approved', true, $6, $7, $7)
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
        "PVP_FACTOR",
        String(row.factor).trim(),
        "ventas_perseida",
        String(row.cliente).trim(),
        defaultValidFrom,
        "Imported from UI or demo file",
        context.adminId,
      ],
    );

    imported += 1;
  }

  return imported;
}

export async function importDemoWorkbook(buffer: Buffer) {
  const mappingRows = sheetRowsFromBuffer(buffer, "mdm_clientes_equivalencia");
  const groupingRows = sheetRowsFromBuffer(buffer, "mdm_clientes_agrupacion");
  const parameterRows = sheetRowsFromBuffer(buffer, "mdm_parametros_pvp");

  const mappings = await importMappingRows(mappingRows);
  const groups = await importGroupRows(groupingRows);
  const parameters = await importParameterRows(parameterRows);

  return { mappings, groups, parameters };
}

export async function importUploadedFile(target: UploadTarget, buffer: Buffer) {
  const rows = firstSheetRowsFromBuffer(buffer);

  switch (target) {
    case "mappings":
      return {
        target,
        imported: await importMappingRows(rows),
      };
    case "groups":
      return {
        target,
        imported: await importGroupRows(rows),
      };
    case "parameters":
      return {
        target,
        imported: await importParameterRows(rows),
      };
    default:
      throw new Error("Unsupported import target.");
  }
}