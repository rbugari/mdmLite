import fs from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const reportsDir = path.join(rootDir, "reports");
const reportPath = path.join(reportsDir, "demo-reset-latest.json");

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

function isoDateWithOffset(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function ensureReportsDir() {
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
}

async function fetchSingleValue(client, sql, values, label) {
  const result = await client.query(sql, values);
  const row = result.rows[0];
  const value = row ? Object.values(row)[0] : null;
  ensure(value, `${label} not found.`);
  return value;
}

async function resolveAdminUser(client) {
  const configuredEmail = process.env.APP_ADMIN_EMAIL?.trim();

  if (configuredEmail) {
    const configuredResult = await client.query(
      "select id::text, email from mdm_user where email = $1 limit 1",
      [configuredEmail],
    );

    if (configuredResult.rows[0]?.id) {
      return configuredResult.rows[0];
    }
  }

  const defaultResult = await client.query(
    "select id::text, email from mdm_user where email = 'admin@mdmlite.local' limit 1",
  );

  if (defaultResult.rows[0]?.id) {
    return defaultResult.rows[0];
  }

  const adminRoleResult = await client.query(
    `
      select u.id::text, u.email
      from mdm_user u
      join mdm_role r on r.id = u.role_id
      where r.code = 'ADMIN'
      order by u.created_at asc
      limit 1
    `,
  );

  ensure(adminRoleResult.rows[0]?.id, "No ADMIN user found in mdm_user.");
  return adminRoleResult.rows[0];
}

async function ensureRuleSet(client, adminId, config) {
  const ruleSetId = randomUUID();
  const result = await client.query(
    `
      insert into mdm_rule_set (
        id,
        code,
        name,
        domain,
        description,
        status,
        is_active,
        created_by,
        updated_by
      )
      values ($1, $2, $3, $4, $5, 'active', true, $6, $6)
      on conflict (code)
      do update set
        name = excluded.name,
        domain = excluded.domain,
        description = excluded.description,
        status = 'active',
        is_active = true,
        updated_by = excluded.updated_by,
        updated_at = current_timestamp
      returning id::text
    `,
    [ruleSetId, config.code, config.name, config.domain, config.description, adminId],
  );

  return result.rows[0]?.id;
}

async function insertChangeLog(client, payload) {
  await client.query(
    `
      insert into mdm_change_log (
        id,
        table_name,
        record_id,
        action_type,
        old_value_json,
        new_value_json,
        changed_by,
        changed_at,
        approval_status,
        approval_by,
        approval_at,
        comments
      )
      values ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, current_timestamp, $8, $9, current_timestamp, $10)
    `,
    [
      randomUUID(),
      payload.tableName,
      payload.recordId,
      payload.actionType,
      payload.oldValue ? JSON.stringify(payload.oldValue) : null,
      payload.newValue ? JSON.stringify(payload.newValue) : null,
      payload.changedBy,
      payload.approvalStatus ?? null,
      payload.approvalBy ?? null,
      payload.comments,
    ],
  );
}

async function insertMapping(client, adminId, row) {
  const recordId = randomUUID();
  const result = await client.query(
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
      values ($1, $2, $3, $4, $5, $6, $7, 100, $8, $9, true, $10, $11, $11)
      returning id::text
    `,
    [
      recordId,
      row.ruleSetId,
      row.entityTypeId,
      row.sourceKey,
      row.sourceValue,
      row.targetValue,
      row.targetLabel,
      row.validFrom,
      row.status,
      row.comments,
      adminId,
    ],
  );

  const insertedRecordId = result.rows[0]?.id;
  ensure(insertedRecordId, "Failed to insert demo mapping.");

  await insertChangeLog(client, {
    tableName: "mdm_mapping_rule",
    recordId: insertedRecordId,
    actionType: "create",
    newValue: {
      sourceValue: row.sourceValue,
      targetValue: row.targetValue,
      validFrom: row.validFrom,
      status: row.status,
    },
    changedBy: adminId,
    comments: row.comments,
  });

  if (row.status === "approved") {
    await insertChangeLog(client, {
      tableName: "mdm_mapping_rule",
      recordId: insertedRecordId,
      actionType: "approve",
      oldValue: { status: "pending_approval" },
      newValue: { status: "approved" },
      changedBy: adminId,
      approvalStatus: "approved",
      approvalBy: adminId,
      comments: `${row.comments} | approved for demo walkthrough`,
    });
  }

  if (row.status === "pending_approval") {
    await insertChangeLog(client, {
      tableName: "mdm_mapping_rule",
      recordId: insertedRecordId,
      actionType: "submit",
      oldValue: { status: "draft" },
      newValue: { status: "pending_approval" },
      changedBy: adminId,
      approvalStatus: "pending_approval",
      approvalBy: adminId,
      comments: `${row.comments} | pending example for approval queue`,
    });
  }

  return insertedRecordId;
}

async function insertGroup(client, adminId, row) {
  const recordId = randomUUID();
  const result = await client.query(
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
      values ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10, $10)
      returning id::text
    `,
    [
      recordId,
      row.ruleSetId,
      row.entityTypeId,
      row.memberValue,
      row.groupValue,
      row.groupLabel,
      row.validFrom,
      row.status,
      row.comments,
      adminId,
    ],
  );

  const insertedRecordId = result.rows[0]?.id;
  ensure(insertedRecordId, "Failed to insert demo group.");

  await insertChangeLog(client, {
    tableName: "mdm_group_rule",
    recordId: insertedRecordId,
    actionType: "create",
    newValue: {
      memberValue: row.memberValue,
      groupValue: row.groupValue,
      validFrom: row.validFrom,
      status: row.status,
    },
    changedBy: adminId,
    comments: row.comments,
  });

  if (row.status === "approved") {
    await insertChangeLog(client, {
      tableName: "mdm_group_rule",
      recordId: insertedRecordId,
      actionType: "approve",
      oldValue: { status: "pending_approval" },
      newValue: { status: "approved" },
      changedBy: adminId,
      approvalStatus: "approved",
      approvalBy: adminId,
      comments: `${row.comments} | approved for demo walkthrough`,
    });
  }

  if (row.status === "pending_approval") {
    await insertChangeLog(client, {
      tableName: "mdm_group_rule",
      recordId: insertedRecordId,
      actionType: "submit",
      oldValue: { status: "draft" },
      newValue: { status: "pending_approval" },
      changedBy: adminId,
      approvalStatus: "pending_approval",
      approvalBy: adminId,
      comments: `${row.comments} | pending example for approval queue`,
    });
  }

  return insertedRecordId;
}

async function insertParameter(client, adminId, row) {
  const recordId = randomUUID();
  const result = await client.query(
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
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11, $11)
      returning id::text
    `,
    [
      recordId,
      row.parameterKey,
      row.parameterValue,
      row.dataType,
      row.domain,
      row.scopeType,
      row.scopeValue,
      row.validFrom,
      row.status,
      row.description,
      adminId,
    ],
  );

  const insertedRecordId = result.rows[0]?.id;
  ensure(insertedRecordId, "Failed to insert demo parameter.");

  await insertChangeLog(client, {
    tableName: "mdm_parameter",
    recordId: insertedRecordId,
    actionType: "create",
    newValue: {
      parameterKey: row.parameterKey,
      parameterValue: row.parameterValue,
      domain: row.domain,
      scopeType: row.scopeType,
      scopeValue: row.scopeValue,
      validFrom: row.validFrom,
      status: row.status,
    },
    changedBy: adminId,
    comments: row.description,
  });

  if (row.status === "approved") {
    await insertChangeLog(client, {
      tableName: "mdm_parameter",
      recordId: insertedRecordId,
      actionType: "approve",
      oldValue: { status: "pending_approval" },
      newValue: { status: "approved" },
      changedBy: adminId,
      approvalStatus: "approved",
      approvalBy: adminId,
      comments: `${row.description} | approved for demo walkthrough`,
    });
  }

  if (row.status === "pending_approval") {
    await insertChangeLog(client, {
      tableName: "mdm_parameter",
      recordId: insertedRecordId,
      actionType: "submit",
      oldValue: { status: "draft" },
      newValue: { status: "pending_approval" },
      changedBy: adminId,
      approvalStatus: "pending_approval",
      approvalBy: adminId,
      comments: `${row.description} | pending example for approval queue`,
    });
  }

  return insertedRecordId;
}

loadEnvFile(envPath);

ensure(process.env.DATABASE_URL, "DATABASE_URL is not configured.");

const activeFrom = isoDateWithOffset(-30);
const pendingFrom = isoDateWithOffset(0);
const futureFrom = isoDateWithOffset(14);

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: getSslConfig(),
});

const report = {
  generatedAt: new Date().toISOString(),
  mode: "demo-reset-seed",
  notes: [
    "Deletes operational data from mappings, groups, parameters, import batches, and audit log.",
    "Keeps base catalogs such as roles, users, entity types, and rule sets.",
    "Seeds a didactic scenario for CLIENT and PRODUCT with approved and pending examples.",
  ],
  cleanup: {},
  seeded: {},
  validations: {},
  samples: {},
};

try {
  await client.connect();
  await client.query("begin");

  const adminUser = await resolveAdminUser(client);
  const adminId = adminUser.id;

  const clientEntityId = await fetchSingleValue(
    client,
    "select id::text from mdm_entity_type where code = 'CLIENT' limit 1",
    [],
    "Entity type CLIENT",
  );
  const productEntityId = await fetchSingleValue(
    client,
    "select id::text from mdm_entity_type where code = 'PRODUCT' limit 1",
    [],
    "Entity type PRODUCT",
  );

  const clientRuleSetId = await ensureRuleSet(client, adminId, {
    code: "demo_capacitacion_clientes",
    name: "Demo Capacitacion Clientes",
    domain: "demo_training",
    description: "Escenario didactico para mostrar homologacion, agrupacion y parametros de clientes.",
  });
  const productRuleSetId = await ensureRuleSet(client, adminId, {
    code: "demo_capacitacion_productos",
    name: "Demo Capacitacion Productos",
    domain: "demo_training",
    description: "Escenario didactico para mostrar homologacion, agrupacion y parametros de productos.",
  });

  await client.query(
    `
      truncate table
        mdm_change_log,
        mdm_import_item,
        mdm_import_batch,
        mdm_mapping_rule,
        mdm_group_rule,
        mdm_parameter
    `,
  );

  report.cleanup = {
    status: "ok",
    truncatedTables: [
      "mdm_change_log",
      "mdm_import_item",
      "mdm_import_batch",
      "mdm_mapping_rule",
      "mdm_group_rule",
      "mdm_parameter",
    ],
  };

  const approvedMappings = [
    {
      ruleSetId: clientRuleSetId,
      entityTypeId: clientEntityId,
      sourceKey: "customer_name",
      sourceValue: "ACME S.A.",
      targetValue: "ACME_RETAIL",
      targetLabel: "Acme Retail",
      validFrom: activeFrom,
      status: "approved",
      comments: "Demo CLIENT: normaliza una variante comun de razon social.",
    },
    {
      ruleSetId: clientRuleSetId,
      entityTypeId: clientEntityId,
      sourceKey: "customer_name",
      sourceValue: "ACME SA",
      targetValue: "ACME_RETAIL",
      targetLabel: "Acme Retail",
      validFrom: activeFrom,
      status: "approved",
      comments: "Demo CLIENT: segunda variante que converge al mismo canonico.",
    },
    {
      ruleSetId: clientRuleSetId,
      entityTypeId: clientEntityId,
      sourceKey: "customer_name",
      sourceValue: "MEGA STORE",
      targetValue: "MEGA_STORE",
      targetLabel: "Mega Store",
      validFrom: activeFrom,
      status: "approved",
      comments: "Demo CLIENT: equivalencia para una cuenta con naming simplificado.",
    },
    {
      ruleSetId: clientRuleSetId,
      entityTypeId: clientEntityId,
      sourceKey: "customer_name",
      sourceValue: "MEGASTORE ONLINE",
      targetValue: "MEGA_STORE",
      targetLabel: "Mega Store",
      validFrom: activeFrom,
      status: "approved",
      comments: "Demo CLIENT: fuente ecommerce que debe caer al mismo cliente canonico.",
    },
    {
      ruleSetId: productRuleSetId,
      entityTypeId: productEntityId,
      sourceKey: "product_name",
      sourceValue: "CAF 1KG",
      targetValue: "SKU_COFFEE_1KG",
      targetLabel: "Cafe Molido 1KG",
      validFrom: activeFrom,
      status: "approved",
      comments: "Demo PRODUCT: alias corto heredado del ERP.",
    },
    {
      ruleSetId: productRuleSetId,
      entityTypeId: productEntityId,
      sourceKey: "product_name",
      sourceValue: "CAFE MOLIDO 1KG",
      targetValue: "SKU_COFFEE_1KG",
      targetLabel: "Cafe Molido 1KG",
      validFrom: activeFrom,
      status: "approved",
      comments: "Demo PRODUCT: nombre descriptivo que converge al mismo SKU canonico.",
    },
    {
      ruleSetId: productRuleSetId,
      entityTypeId: productEntityId,
      sourceKey: "product_name",
      sourceValue: "TE VERDE CAJA",
      targetValue: "SKU_GREEN_TEA_BOX",
      targetLabel: "Te Verde Caja",
      validFrom: activeFrom,
      status: "approved",
      comments: "Demo PRODUCT: variante en castellano para un mismo item vendible.",
    },
    {
      ruleSetId: productRuleSetId,
      entityTypeId: productEntityId,
      sourceKey: "product_name",
      sourceValue: "GREEN TEA BOX",
      targetValue: "SKU_GREEN_TEA_BOX",
      targetLabel: "Te Verde Caja",
      validFrom: activeFrom,
      status: "approved",
      comments: "Demo PRODUCT: variante en ingles para mostrar convergencia multifuente.",
    },
  ];

  const pendingMappings = [
    {
      ruleSetId: clientRuleSetId,
      entityTypeId: clientEntityId,
      sourceKey: "customer_name",
      sourceValue: "ACME RETAIL LEGACY",
      targetValue: "ACME_RETAIL",
      targetLabel: "Acme Retail",
      validFrom: pendingFrom,
      status: "pending_approval",
      comments: "Demo CLIENT: ejemplo pendiente para explicar la cola de aprobacion.",
    },
    {
      ruleSetId: productRuleSetId,
      entityTypeId: productEntityId,
      sourceKey: "product_name",
      sourceValue: "COFFEE PACK 1KG",
      targetValue: "SKU_COFFEE_1KG",
      targetLabel: "Cafe Molido 1KG",
      validFrom: pendingFrom,
      status: "pending_approval",
      comments: "Demo PRODUCT: propuesta pendiente que todavia no impacta vistas activas.",
    },
  ];

  const approvedGroups = [
    {
      ruleSetId: clientRuleSetId,
      entityTypeId: clientEntityId,
      memberValue: "ACME_RETAIL",
      groupValue: "MODERN_TRADE",
      groupLabel: "Modern Trade",
      validFrom: activeFrom,
      status: "approved",
      comments: "Demo CLIENT: agrupa un cliente canonico dentro de un segmento comercial.",
    },
    {
      ruleSetId: clientRuleSetId,
      entityTypeId: clientEntityId,
      memberValue: "MEGA_STORE",
      groupValue: "DIGITAL_KEY_ACCOUNTS",
      groupLabel: "Digital Key Accounts",
      validFrom: activeFrom,
      status: "approved",
      comments: "Demo CLIENT: muestra un grupo de negocio distinto para la segunda cuenta.",
    },
    {
      ruleSetId: productRuleSetId,
      entityTypeId: productEntityId,
      memberValue: "SKU_COFFEE_1KG",
      groupValue: "HOT_BEVERAGES",
      groupLabel: "Hot Beverages",
      validFrom: activeFrom,
      status: "approved",
      comments: "Demo PRODUCT: categoriza producto para reporting y pricing.",
    },
    {
      ruleSetId: productRuleSetId,
      entityTypeId: productEntityId,
      memberValue: "SKU_GREEN_TEA_BOX",
      groupValue: "HOT_BEVERAGES",
      groupLabel: "Hot Beverages",
      validFrom: activeFrom,
      status: "approved",
      comments: "Demo PRODUCT: comparte familia con el cafe para mostrar agrupacion comun.",
    },
  ];

  const pendingGroups = [
    {
      ruleSetId: productRuleSetId,
      entityTypeId: productEntityId,
      memberValue: "SKU_COFFEE_1KG",
      groupValue: "PREMIUM_BEVERAGES",
      groupLabel: "Premium Beverages",
      validFrom: futureFrom,
      status: "pending_approval",
      comments: "Demo PRODUCT: cambio futuro pendiente para mostrar evolucion del master data.",
    },
  ];

  const approvedParameters = [
    {
      parameterKey: "PVP_FACTOR",
      parameterValue: "1.08",
      dataType: "numeric",
      domain: "demo_training",
      scopeType: "CLIENT",
      scopeValue: "ACME_RETAIL",
      validFrom: activeFrom,
      status: "approved",
      description: "Demo CLIENT: factor comercial aplicado al cliente canonico Acme Retail.",
    },
    {
      parameterKey: "PVP_FACTOR",
      parameterValue: "1.03",
      dataType: "numeric",
      domain: "demo_training",
      scopeType: "CLIENT",
      scopeValue: "MEGA_STORE",
      validFrom: activeFrom,
      status: "approved",
      description: "Demo CLIENT: segundo factor para comparar cuentas y explicar pricing.",
    },
    {
      parameterKey: "MIN_MARGIN",
      parameterValue: "0.18",
      dataType: "numeric",
      domain: "demo_training",
      scopeType: "PRODUCT",
      scopeValue: "SKU_COFFEE_1KG",
      validFrom: activeFrom,
      status: "approved",
      description: "Demo PRODUCT: margen minimo requerido para el SKU principal.",
    },
    {
      parameterKey: "MIN_MARGIN",
      parameterValue: "0.15",
      dataType: "numeric",
      domain: "demo_training",
      scopeType: "PRODUCT",
      scopeValue: "SKU_GREEN_TEA_BOX",
      validFrom: activeFrom,
      status: "approved",
      description: "Demo PRODUCT: margen minimo alternativo para el segundo SKU.",
    },
  ];

  const pendingParameters = [
    {
      parameterKey: "PVP_FACTOR",
      parameterValue: "1.10",
      dataType: "numeric",
      domain: "demo_training",
      scopeType: "CLIENT",
      scopeValue: "ACME_RETAIL",
      validFrom: futureFrom,
      status: "pending_approval",
      description: "Demo CLIENT: ajuste futuro pendiente para la cuenta Acme Retail.",
    },
  ];

  for (const row of [...approvedMappings, ...pendingMappings]) {
    await insertMapping(client, adminId, row);
  }

  for (const row of [...approvedGroups, ...pendingGroups]) {
    await insertGroup(client, adminId, row);
  }

  for (const row of [...approvedParameters, ...pendingParameters]) {
    await insertParameter(client, adminId, row);
  }

  const countResult = await client.query(`
    select
      (select count(*)::int from mdm_mapping_rule) as mappings_total,
      (select count(*)::int from mdm_group_rule) as groups_total,
      (select count(*)::int from mdm_parameter) as parameters_total,
      (select count(*)::int from mdm_mapping_rule where status = 'pending_approval') as mappings_pending,
      (select count(*)::int from mdm_group_rule where status = 'pending_approval') as groups_pending,
      (select count(*)::int from mdm_parameter where status = 'pending_approval') as parameters_pending,
      (select count(*)::int from vw_mdm_mapping_rule_active) as mapping_active,
      (select count(*)::int from vw_mdm_group_rule_active) as group_active,
      (select count(*)::int from vw_mdm_parameter_active) as parameter_active,
      (select count(*)::int from mdm_change_log) as audit_rows
  `);

  const counts = countResult.rows[0];

  ensure(counts.mappings_total === 10, `Expected 10 mappings, got ${counts.mappings_total}.`);
  ensure(counts.groups_total === 5, `Expected 5 groups, got ${counts.groups_total}.`);
  ensure(counts.parameters_total === 5, `Expected 5 parameters, got ${counts.parameters_total}.`);
  ensure(counts.mappings_pending === 2, `Expected 2 pending mappings, got ${counts.mappings_pending}.`);
  ensure(counts.groups_pending === 1, `Expected 1 pending group, got ${counts.groups_pending}.`);
  ensure(counts.parameters_pending === 1, `Expected 1 pending parameter, got ${counts.parameters_pending}.`);
  ensure(counts.mapping_active === 8, `Expected 8 active mappings, got ${counts.mapping_active}.`);
  ensure(counts.group_active === 4, `Expected 4 active groups, got ${counts.group_active}.`);
  ensure(counts.parameter_active === 4, `Expected 4 active parameters, got ${counts.parameter_active}.`);
  ensure(counts.audit_rows === 40, `Expected 40 audit rows, got ${counts.audit_rows}.`);

  const activeSamplesResult = await client.query(
    `
      select entity, code, value, label
      from (
        select 'mapping'::text as entity, source_value as code, target_value as value, target_label as label
        from vw_mdm_mapping_rule_active
        where entity_type_code = 'CLIENT'
        order by source_value
        limit 3
      ) q
    `,
  );

  const pendingSamplesResult = await client.query(
    `
      select entity, label, status
      from (
        select 'mapping'::text as entity, concat(source_key, ' = ', source_value, ' -> ', target_value) as label, status, updated_at
        from mdm_mapping_rule
        where status = 'pending_approval'
        union all
        select 'group'::text as entity, concat(member_value, ' -> ', group_value) as label, status, updated_at
        from mdm_group_rule
        where status = 'pending_approval'
        union all
        select 'parameter'::text as entity, concat(parameter_key, ' = ', parameter_value, ' @ ', coalesce(parameter_scope_value, 'GLOBAL')) as label, status, updated_at
        from mdm_parameter
        where status = 'pending_approval'
      ) q
      order by updated_at desc
      limit 5
    `,
  );

  report.seeded = {
    adminUser: adminUser.email,
    approvedMappings: approvedMappings.length,
    pendingMappings: pendingMappings.length,
    approvedGroups: approvedGroups.length,
    pendingGroups: pendingGroups.length,
    approvedParameters: approvedParameters.length,
    pendingParameters: pendingParameters.length,
    entities: ["CLIENT", "PRODUCT"],
    ruleSets: ["demo_capacitacion_clientes", "demo_capacitacion_productos"],
  };

  report.validations = {
    counts,
    status: "GO",
  };
  report.samples = {
    activeClientMappings: activeSamplesResult.rows,
    pendingQueue: pendingSamplesResult.rows,
  };

  await client.query("commit");

  ensureReportsDir();
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("demo_reset=ok");
  console.log(`demo_seeded_entities=${report.seeded.entities.join(",")}`);
  console.log(`demo_counts=mappings:${counts.mappings_total},groups:${counts.groups_total},parameters:${counts.parameters_total}`);
  console.log(`demo_pending_queue=${counts.mappings_pending + counts.groups_pending + counts.parameters_pending}`);
  console.log(`demo_active_views=mappings:${counts.mapping_active},groups:${counts.group_active},parameters:${counts.parameter_active}`);
  console.log(`demo_audit_rows=${counts.audit_rows}`);
  console.log(`demo_report=${reportPath}`);
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  console.error("demo_reset=failed");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}