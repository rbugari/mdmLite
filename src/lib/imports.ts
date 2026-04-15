import * as xlsx from "xlsx";

import { query } from "@/lib/db";

const defaultValidFrom = "2024-01-01";

export type UploadTarget = "mappings" | "groups" | "parameters";

type ImportContext = {
  adminId: string;
  clientEntityTypeId: string;
  clientRuleSetId: string;
};

type NormalizedMappingRow = {
  sourceValue: string;
  targetValue: string;
  isActive: boolean;
};

type NormalizedGroupRow = {
  memberValue: string;
  groupValue: string;
};

type NormalizedParameterRow = {
  scopeValue: string;
  factorValue: string;
};

type NormalizedRow =
  | { target: "mappings"; key: string; row: NormalizedMappingRow }
  | { target: "groups"; key: string; row: NormalizedGroupRow }
  | { target: "parameters"; key: string; row: NormalizedParameterRow };

type PreviewIssue = {
  rowNumber: number;
  code: "missing_required" | "duplicate_in_file";
  message: string;
};

type PreviewSummary = {
  totalRows: number;
  validRows: number;
  errors: number;
  duplicatesInFile: number;
  potentialInserts: number;
  potentialUpdates: number;
};

type StoredPreview = {
  target: UploadTarget;
  createdAt: number;
  expiresAt: number;
  fileName: string;
  summary: PreviewSummary;
  issues: PreviewIssue[];
  normalizedRows: NormalizedRow[];
};

const PREVIEW_TTL_MS = 10 * 60 * 1000;

function getPreviewStore() {
  const globalState = globalThis as {
    __mdmImportPreviewStore?: Map<string, StoredPreview>;
  };

  if (!globalState.__mdmImportPreviewStore) {
    globalState.__mdmImportPreviewStore = new Map<string, StoredPreview>();
  }

  return globalState.__mdmImportPreviewStore;
}

function cleanupExpiredPreviews() {
  const store = getPreviewStore();
  const now = Date.now();

  for (const [token, value] of store.entries()) {
    if (value.expiresAt <= now) {
      store.delete(token);
    }
  }
}

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
  const configuredEmail = process.env.APP_ADMIN_EMAIL ?? "admin@mdmlite.local";
  const configuredAdminResult = await query<{ id: string }>(
    `
      select u.id
      from mdm_user u
      join mdm_role r on r.id = u.role_id
      where u.email = $1
        and u.is_active = true
        and r.code = 'ADMIN'
      limit 1
    `,
    [configuredEmail],
  );

  const fallbackAdminResult =
    (configuredAdminResult.rowCount ?? 0) > 0
      ? configuredAdminResult
      : await query<{ id: string }>(
          `
            select u.id
            from mdm_user u
            join mdm_role r on r.id = u.role_id
            where u.is_active = true
              and r.code = 'ADMIN'
            order by u.created_at asc
            limit 1
          `,
        );

  if (!fallbackAdminResult.rowCount || !fallbackAdminResult.rows[0]) {
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
    adminId: fallbackAdminResult.rows[0].id,
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

async function importNormalizedMappings(rows: NormalizedMappingRow[]) {
  const context = await getImportContext();
  let imported = 0;

  for (const row of rows) {
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
        row.sourceValue,
        row.targetValue,
        row.targetValue,
        defaultValidFrom,
        row.isActive,
        "Imported from upload confirmation",
        context.adminId,
      ],
    );

    imported += 1;
  }

  return imported;
}

async function importNormalizedGroups(rows: NormalizedGroupRow[]) {
  const context = await getImportContext();
  let imported = 0;

  for (const row of rows) {
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
        row.memberValue,
        row.groupValue,
        row.groupValue,
        defaultValidFrom,
        "Imported from upload confirmation",
        context.adminId,
      ],
    );

    imported += 1;
  }

  return imported;
}

async function importNormalizedParameters(rows: NormalizedParameterRow[]) {
  const context = await getImportContext();
  let imported = 0;

  for (const row of rows) {
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
        row.factorValue,
        "ventas_perseida",
        row.scopeValue,
        defaultValidFrom,
        "Imported from upload confirmation",
        context.adminId,
      ],
    );

    imported += 1;
  }

  return imported;
}

async function computePreviewImpact(normalizedRows: NormalizedRow[]) {
  const context = await getImportContext();
  const existing = new Set<string>();

  if (normalizedRows.length === 0) {
    return { potentialInserts: 0, potentialUpdates: 0 };
  }

  const mappingKeys = normalizedRows.filter((x) => x.target === "mappings").map((x) => x.row.sourceValue);
  const groupKeys = normalizedRows.filter((x) => x.target === "groups").map((x) => x.row.memberValue);
  const parameterKeys = normalizedRows.filter((x) => x.target === "parameters").map((x) => x.row.scopeValue);

  if (mappingKeys.length > 0) {
    const result = await query<{ source_value: string }>(
      `
        select source_value
        from mdm_mapping_rule
        where rule_set_id = $1
          and entity_type_id = $2
          and source_key = 'customer_name'
          and valid_from = $3::date
          and source_value = any($4::text[])
      `,
      [context.clientRuleSetId, context.clientEntityTypeId, defaultValidFrom, mappingKeys],
    );

    for (const row of result.rows) {
      existing.add(`mappings:${row.source_value}`);
    }
  }

  if (groupKeys.length > 0) {
    const result = await query<{ member_value: string }>(
      `
        select member_value
        from mdm_group_rule
        where rule_set_id = $1
          and entity_type_id = $2
          and valid_from = $3::date
          and member_value = any($4::text[])
      `,
      [context.clientRuleSetId, context.clientEntityTypeId, defaultValidFrom, groupKeys],
    );

    for (const row of result.rows) {
      existing.add(`groups:${row.member_value}`);
    }
  }

  if (parameterKeys.length > 0) {
    const result = await query<{ parameter_scope_value: string }>(
      `
        select parameter_scope_value
        from mdm_parameter
        where parameter_key = 'PVP_FACTOR'
          and domain = 'ventas_perseida'
          and parameter_scope_type = 'CLIENT'
          and valid_from = $1::date
          and parameter_scope_value = any($2::text[])
      `,
      [defaultValidFrom, parameterKeys],
    );

    for (const row of result.rows) {
      existing.add(`parameters:${row.parameter_scope_value}`);
    }
  }

  let potentialUpdates = 0;
  let potentialInserts = 0;

  for (const row of normalizedRows) {
    if (existing.has(row.key)) {
      potentialUpdates += 1;
    } else {
      potentialInserts += 1;
    }
  }

  return { potentialInserts, potentialUpdates };
}

function normalizeRowsForPreview(target: UploadTarget, rows: Record<string, unknown>[]) {
  const issues: PreviewIssue[] = [];
  const normalizedRows: NormalizedRow[] = [];
  const seenKeys = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;

    if (target === "mappings") {
      const sourceValue = String(row.source_value ?? "").trim();
      const targetValue = String(row.target_value ?? "").trim();

      if (!sourceValue || !targetValue) {
        issues.push({
          rowNumber,
          code: "missing_required",
          message: "source_value and target_value are required.",
        });
        return;
      }

      const key = `mappings:${sourceValue}`;
      if (seenKeys.has(key)) {
        issues.push({
          rowNumber,
          code: "duplicate_in_file",
          message: `Duplicate source_value in file: ${sourceValue}`,
        });
        return;
      }

      seenKeys.add(key);
      normalizedRows.push({
        target,
        key,
        row: {
          sourceValue,
          targetValue,
          isActive: row.activo === null ? true : toBoolean(row.activo),
        },
      });
      return;
    }

    if (target === "groups") {
      const memberValue = String(row.cliente ?? "").trim();
      const groupValue = String(row.grupo_cliente ?? "").trim();

      if (!memberValue || !groupValue) {
        issues.push({
          rowNumber,
          code: "missing_required",
          message: "cliente and grupo_cliente are required.",
        });
        return;
      }

      const key = `groups:${memberValue}`;
      if (seenKeys.has(key)) {
        issues.push({
          rowNumber,
          code: "duplicate_in_file",
          message: `Duplicate cliente in file: ${memberValue}`,
        });
        return;
      }

      seenKeys.add(key);
      normalizedRows.push({
        target,
        key,
        row: {
          memberValue,
          groupValue,
        },
      });
      return;
    }

    const scopeValue = String(row.cliente ?? "").trim();
    const factorValue = String(row.factor ?? "").trim();

    if (!scopeValue || !factorValue) {
      issues.push({
        rowNumber,
        code: "missing_required",
        message: "cliente and factor are required.",
      });
      return;
    }

    const key = `parameters:${scopeValue}`;
    if (seenKeys.has(key)) {
      issues.push({
        rowNumber,
        code: "duplicate_in_file",
        message: `Duplicate cliente in file: ${scopeValue}`,
      });
      return;
    }

    seenKeys.add(key);
    normalizedRows.push({
      target,
      key,
      row: {
        scopeValue,
        factorValue,
      },
    });
  });

  return { issues, normalizedRows };
}

export async function previewUploadedFile(target: UploadTarget, buffer: Buffer, fileName: string) {
  cleanupExpiredPreviews();

  const rows = firstSheetRowsFromBuffer(buffer);
  const { issues, normalizedRows } = normalizeRowsForPreview(target, rows);
  const impact = await computePreviewImpact(normalizedRows);

  const summary: PreviewSummary = {
    totalRows: rows.length,
    validRows: normalizedRows.length,
    errors: issues.length,
    duplicatesInFile: issues.filter((x) => x.code === "duplicate_in_file").length,
    potentialInserts: impact.potentialInserts,
    potentialUpdates: impact.potentialUpdates,
  };

  const token = crypto.randomUUID();
  const now = Date.now();

  const store = getPreviewStore();
  store.set(token, {
    target,
    fileName,
    createdAt: now,
    expiresAt: now + PREVIEW_TTL_MS,
    summary,
    issues,
    normalizedRows,
  });

  return {
    target,
    fileName,
    token,
    expiresInSeconds: Math.floor(PREVIEW_TTL_MS / 1000),
    summary,
    issues: issues.slice(0, 100),
    hasMoreIssues: issues.length > 100,
    canConfirm: normalizedRows.length > 0,
  };
}

export async function confirmUploadedPreview(token: string) {
  cleanupExpiredPreviews();

  const store = getPreviewStore();
  const preview = store.get(token);

  if (!preview) {
    throw new Error("Preview token not found or expired. Run preview again.");
  }

  store.delete(token);

  const mappings = preview.normalizedRows.filter((x): x is Extract<NormalizedRow, { target: "mappings" }> => x.target === "mappings");
  const groups = preview.normalizedRows.filter((x): x is Extract<NormalizedRow, { target: "groups" }> => x.target === "groups");
  const parameters = preview.normalizedRows.filter((x): x is Extract<NormalizedRow, { target: "parameters" }> => x.target === "parameters");

  let imported = 0;

  if (preview.target === "mappings") {
    imported = await importNormalizedMappings(mappings.map((x) => x.row));
  } else if (preview.target === "groups") {
    imported = await importNormalizedGroups(groups.map((x) => x.row));
  } else {
    imported = await importNormalizedParameters(parameters.map((x) => x.row));
  }

  return {
    target: preview.target,
    fileName: preview.fileName,
    imported,
    summary: preview.summary,
  };
}