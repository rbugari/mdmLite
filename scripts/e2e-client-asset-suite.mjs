import fs from "node:fs";
import path from "node:path";

import { Client } from "pg";

function loadEnv(pathToEnv) {
  const env = {
    ...process.env,
  };

  if (!fs.existsSync(pathToEnv)) {
    return env;
  }

  const txt = fs.readFileSync(pathToEnv, "utf8");

  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) {
      env[m[1]] = m[2];
    }
  }

  return env;
}

async function ensureOk(response, stepName) {
  const txt = await response.text();
  let payload;

  try {
    payload = txt ? JSON.parse(txt) : {};
  } catch {
    throw new Error(`${stepName} failed with non-JSON response (${response.status}): ${txt}`);
  }

  if (!response.ok || payload.ok === false) {
    throw new Error(`${stepName} failed (${response.status}): ${payload.error ?? txt}`);
  }

  return payload;
}

async function fetchPending(baseUrl, cookie) {
  return ensureOk(
    await fetch(`${baseUrl}/api/workflow/pending`, { headers: { cookie } }),
    "fetch pending queue",
  );
}

async function transition(baseUrl, cookie, payload, expectedStatus) {
  const out = await ensureOk(
    await fetch(`${baseUrl}/api/workflow/transition`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(payload),
    }),
    `transition ${payload.entity} ${payload.action}`,
  );

  if (expectedStatus && out.status !== expectedStatus) {
    throw new Error(`transition ${payload.entity}/${payload.action} expected ${expectedStatus} but got ${out.status}`);
  }

  return out;
}

function tomorrowDateIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function assertVisibleById(baseUrl, endpoint, id, shouldBeVisible, label) {
  const out = await ensureOk(await fetch(`${baseUrl}${endpoint}`), `read ${endpoint}`);
  const visible = (out.items ?? []).some((x) => x.id === id);

  if (visible !== shouldBeVisible) {
    throw new Error(`${label} visibility mismatch, expected=${String(shouldBeVisible)} got=${String(visible)}`);
  }
}

async function uploadPreview(baseUrl, cookie, target, filePath) {
  const form = new FormData();
  form.append("target", target);
  form.append("file", new Blob([fs.readFileSync(filePath)]), path.basename(filePath));

  return ensureOk(
    await fetch(`${baseUrl}/api/imports/upload/preview`, {
      method: "POST",
      headers: { cookie },
      body: form,
    }),
    `preview ${target} import`,
  );
}

async function uploadConfirm(baseUrl, cookie, token) {
  return ensureOk(
    await fetch(`${baseUrl}/api/imports/upload/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ token }),
    }),
    "confirm import",
  );
}

async function expectConfirmReuseFails(baseUrl, cookie, token) {
  const response = await fetch(`${baseUrl}/api/imports/upload/confirm`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ token }),
  });

  const txt = await response.text();
  let payload;

  try {
    payload = txt ? JSON.parse(txt) : {};
  } catch {
    throw new Error(`confirm token reuse returned invalid payload: ${txt}`);
  }

  if (response.ok || payload.ok !== false) {
    throw new Error("confirm token reuse should fail but it succeeded");
  }
}

async function cleanupCasRecords(connectionString) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("begin");
    await client.query(`
      delete from mdm_change_log
      where record_id in (
        select id from mdm_mapping_rule where source_value like 'CAS_%'
        union
        select id from mdm_group_rule where member_value like 'CAS_%'
        union
        select id from mdm_parameter where parameter_key like 'CAS_%' or parameter_scope_value like 'CAS_%'
      )
         or comments ilike 'client-suite%'
    `);
    await client.query(`delete from mdm_mapping_rule where source_value like 'CAS_%'`);
    await client.query(`delete from mdm_group_rule where member_value like 'CAS_%'`);
    await client.query(`delete from mdm_parameter where parameter_key like 'CAS_%' or parameter_scope_value like 'CAS_%'`);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

async function runEntityWorkflowSuite(baseUrl, cookie, stamp) {
  const futureDate = tomorrowDateIso();

  // mapping: create + approve
  const mCreate = await ensureOk(
    await fetch(`${baseUrl}/api/mappings`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        sourceValue: `CAS_MAP_CORE_${stamp}`,
        targetValue: "CAS_CANON_V1",
        validFrom: "2024-01-01",
        comments: "client-suite mapping create",
      }),
    }),
    "mapping create",
  );
  void mCreate;

  const pendingAfterMapCreate = await fetchPending(baseUrl, cookie);
  const mapPending = (pendingAfterMapCreate.items ?? []).find((x) => String(x.label).includes(`CAS_MAP_CORE_${stamp}`));
  if (!mapPending) throw new Error("mapping pending not found");
  await transition(baseUrl, cookie, { entity: "mapping", id: mapPending.id, action: "approve", comments: "client-suite approve mapping v1" }, "approved");

  // mapping: non-destructive replacement
  const mUpdate = await ensureOk(
    await fetch(`${baseUrl}/api/mappings/${mapPending.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        sourceValue: `CAS_MAP_CORE_${stamp}`,
        targetValue: "CAS_CANON_V2",
        validFrom: "2024-02-01",
        comments: "client-suite mapping replacement",
      }),
    }),
    "mapping update approved",
  );
  if (mUpdate.mode !== "non_destructive_replacement") throw new Error("mapping replacement mode missing");

  const pendingAfterMapUpdate = await fetchPending(baseUrl, cookie);
  const mapReplacement = (pendingAfterMapUpdate.items ?? []).find(
    (x) => String(x.label).includes(`CAS_MAP_CORE_${stamp}`) && x.id !== mapPending.id,
  );
  if (!mapReplacement) throw new Error("mapping replacement pending not found");
  const mapApproveReplacement = await transition(
    baseUrl,
    cookie,
    { entity: "mapping", id: mapReplacement.id, action: "approve", comments: "client-suite approve mapping v2" },
    "approved",
  );
  if ((mapApproveReplacement.autoInactivatedPrevious ?? 0) < 1) throw new Error("mapping auto inactivate not applied");
  await assertVisibleById(baseUrl, "/api/mappings", mapPending.id, false, "mapping old");
  await assertVisibleById(baseUrl, "/api/mappings", mapReplacement.id, true, "mapping new");

  // mapping: reject
  await ensureOk(
    await fetch(`${baseUrl}/api/mappings`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        sourceValue: `CAS_MAP_REJECT_${stamp}`,
        targetValue: "CAS_REJECT_TARGET",
        validFrom: "2024-01-01",
        comments: "client-suite mapping reject",
      }),
    }),
    "mapping create reject case",
  );
  const pendingMapReject = (await fetchPending(baseUrl, cookie)).items.find((x) => String(x.label).includes(`CAS_MAP_REJECT_${stamp}`));
  if (!pendingMapReject) throw new Error("mapping reject pending not found");
  await transition(baseUrl, cookie, { entity: "mapping", id: pendingMapReject.id, action: "reject", comments: "client-suite reject mapping" }, "rejected");

  // mapping: future approved not visible
  await ensureOk(
    await fetch(`${baseUrl}/api/mappings`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        sourceValue: `CAS_MAP_FUTURE_${stamp}`,
        targetValue: "CAS_FUTURE_TARGET",
        validFrom: futureDate,
        comments: "client-suite mapping future",
      }),
    }),
    "mapping create future case",
  );
  const pendingMapFuture = (await fetchPending(baseUrl, cookie)).items.find((x) => String(x.label).includes(`CAS_MAP_FUTURE_${stamp}`));
  if (!pendingMapFuture) throw new Error("mapping future pending not found");
  await transition(baseUrl, cookie, { entity: "mapping", id: pendingMapFuture.id, action: "approve", comments: "client-suite approve mapping future" }, "approved");
  await assertVisibleById(baseUrl, "/api/mappings", pendingMapFuture.id, false, "mapping future");

  // mapping: inactivate approved
  await transition(baseUrl, cookie, { entity: "mapping", id: mapReplacement.id, action: "inactivate", comments: "client-suite inactivate mapping" }, "inactive");
  await assertVisibleById(baseUrl, "/api/mappings", mapReplacement.id, false, "mapping inactivated");

  // group: create + approve + replacement + reject + future + inactivate
  await ensureOk(
    await fetch(`${baseUrl}/api/groups`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        memberValue: `CAS_GRP_CORE_${stamp}`,
        groupValue: "CAS_GROUP_V1",
        validFrom: "2024-01-01",
        comments: "client-suite group create",
      }),
    }),
    "group create",
  );
  const grpPending = (await fetchPending(baseUrl, cookie)).items.find((x) => String(x.label).includes(`CAS_GRP_CORE_${stamp}`));
  if (!grpPending) throw new Error("group pending not found");
  await transition(baseUrl, cookie, { entity: "group", id: grpPending.id, action: "approve", comments: "client-suite approve group v1" }, "approved");

  const grpUpdate = await ensureOk(
    await fetch(`${baseUrl}/api/groups/${grpPending.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        memberValue: `CAS_GRP_CORE_${stamp}`,
        groupValue: "CAS_GROUP_V2",
        validFrom: "2024-02-01",
        comments: "client-suite group replacement",
      }),
    }),
    "group update approved",
  );
  if (grpUpdate.mode !== "non_destructive_replacement") throw new Error("group replacement mode missing");

  const grpReplacement = (await fetchPending(baseUrl, cookie)).items.find(
    (x) => String(x.label).includes(`CAS_GRP_CORE_${stamp}`) && x.id !== grpPending.id,
  );
  if (!grpReplacement) throw new Error("group replacement pending not found");
  const grpApproveReplacement = await transition(
    baseUrl,
    cookie,
    { entity: "group", id: grpReplacement.id, action: "approve", comments: "client-suite approve group v2" },
    "approved",
  );
  if ((grpApproveReplacement.autoInactivatedPrevious ?? 0) < 1) throw new Error("group auto inactivate not applied");
  await assertVisibleById(baseUrl, "/api/groups", grpPending.id, false, "group old");
  await assertVisibleById(baseUrl, "/api/groups", grpReplacement.id, true, "group new");

  await ensureOk(
    await fetch(`${baseUrl}/api/groups`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        memberValue: `CAS_GRP_REJECT_${stamp}`,
        groupValue: "CAS_GROUP_REJECT",
        validFrom: "2024-01-01",
        comments: "client-suite group reject",
      }),
    }),
    "group create reject case",
  );
  const grpRejectPending = (await fetchPending(baseUrl, cookie)).items.find((x) => String(x.label).includes(`CAS_GRP_REJECT_${stamp}`));
  if (!grpRejectPending) throw new Error("group reject pending not found");
  await transition(baseUrl, cookie, { entity: "group", id: grpRejectPending.id, action: "reject", comments: "client-suite reject group" }, "rejected");

  await ensureOk(
    await fetch(`${baseUrl}/api/groups`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        memberValue: `CAS_GRP_FUTURE_${stamp}`,
        groupValue: "CAS_GROUP_FUTURE",
        validFrom: futureDate,
        comments: "client-suite group future",
      }),
    }),
    "group create future case",
  );
  const grpFuturePending = (await fetchPending(baseUrl, cookie)).items.find((x) => String(x.label).includes(`CAS_GRP_FUTURE_${stamp}`));
  if (!grpFuturePending) throw new Error("group future pending not found");
  await transition(baseUrl, cookie, { entity: "group", id: grpFuturePending.id, action: "approve", comments: "client-suite approve group future" }, "approved");
  await assertVisibleById(baseUrl, "/api/groups", grpFuturePending.id, false, "group future");

  await transition(baseUrl, cookie, { entity: "group", id: grpReplacement.id, action: "inactivate", comments: "client-suite inactivate group" }, "inactive");
  await assertVisibleById(baseUrl, "/api/groups", grpReplacement.id, false, "group inactivated");

  // parameter: create + approve + replacement + reject + future + inactivate
  await ensureOk(
    await fetch(`${baseUrl}/api/parameters`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        parameterKey: `CAS_PAR_CORE_${stamp}`,
        parameterValue: "1.11",
        domain: "ventas_perseida",
        scopeType: "CLIENT",
        scopeValue: `CAS_SCOPE_CORE_${stamp}`,
        validFrom: "2024-01-01",
        comments: "client-suite parameter create",
      }),
    }),
    "parameter create",
  );
  const parPending = (await fetchPending(baseUrl, cookie)).items.find((x) => String(x.label).includes(`CAS_PAR_CORE_${stamp}`));
  if (!parPending) throw new Error("parameter pending not found");
  await transition(baseUrl, cookie, { entity: "parameter", id: parPending.id, action: "approve", comments: "client-suite approve parameter v1" }, "approved");

  const parUpdate = await ensureOk(
    await fetch(`${baseUrl}/api/parameters/${parPending.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        parameterKey: `CAS_PAR_CORE_${stamp}`,
        parameterValue: "1.22",
        domain: "ventas_perseida",
        scopeType: "CLIENT",
        scopeValue: `CAS_SCOPE_CORE_${stamp}`,
        validFrom: "2024-02-01",
        comments: "client-suite parameter replacement",
      }),
    }),
    "parameter update approved",
  );
  if (parUpdate.mode !== "non_destructive_replacement") throw new Error("parameter replacement mode missing");

  const parReplacement = (await fetchPending(baseUrl, cookie)).items.find(
    (x) => String(x.label).includes(`CAS_PAR_CORE_${stamp}`) && x.id !== parPending.id,
  );
  if (!parReplacement) throw new Error("parameter replacement pending not found");
  const parApproveReplacement = await transition(
    baseUrl,
    cookie,
    { entity: "parameter", id: parReplacement.id, action: "approve", comments: "client-suite approve parameter v2" },
    "approved",
  );
  if ((parApproveReplacement.autoInactivatedPrevious ?? 0) < 1) throw new Error("parameter auto inactivate not applied");
  await assertVisibleById(baseUrl, "/api/parameters", parPending.id, false, "parameter old");
  await assertVisibleById(baseUrl, "/api/parameters", parReplacement.id, true, "parameter new");

  await ensureOk(
    await fetch(`${baseUrl}/api/parameters`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        parameterKey: `CAS_PAR_REJECT_${stamp}`,
        parameterValue: "2.01",
        domain: "ventas_perseida",
        scopeType: "CLIENT",
        scopeValue: `CAS_SCOPE_REJECT_${stamp}`,
        validFrom: "2024-01-01",
        comments: "client-suite parameter reject",
      }),
    }),
    "parameter create reject case",
  );
  const parRejectPending = (await fetchPending(baseUrl, cookie)).items.find((x) => String(x.label).includes(`CAS_PAR_REJECT_${stamp}`));
  if (!parRejectPending) throw new Error("parameter reject pending not found");
  await transition(baseUrl, cookie, { entity: "parameter", id: parRejectPending.id, action: "reject", comments: "client-suite reject parameter" }, "rejected");

  await ensureOk(
    await fetch(`${baseUrl}/api/parameters`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        parameterKey: `CAS_PAR_FUTURE_${stamp}`,
        parameterValue: "3.33",
        domain: "ventas_perseida",
        scopeType: "CLIENT",
        scopeValue: `CAS_SCOPE_FUTURE_${stamp}`,
        validFrom: futureDate,
        comments: "client-suite parameter future",
      }),
    }),
    "parameter create future case",
  );
  const parFuturePending = (await fetchPending(baseUrl, cookie)).items.find((x) => String(x.label).includes(`CAS_PAR_FUTURE_${stamp}`));
  if (!parFuturePending) throw new Error("parameter future pending not found");
  await transition(baseUrl, cookie, { entity: "parameter", id: parFuturePending.id, action: "approve", comments: "client-suite approve parameter future" }, "approved");
  await assertVisibleById(baseUrl, "/api/parameters", parFuturePending.id, false, "parameter future");

  await transition(baseUrl, cookie, { entity: "parameter", id: parReplacement.id, action: "inactivate", comments: "client-suite inactivate parameter" }, "inactive");
  await assertVisibleById(baseUrl, "/api/parameters", parReplacement.id, false, "parameter inactivated");

  console.log("workflow_suite=ok");
}

async function runImportSuite(baseUrl, cookie) {
  const basePath = path.join(process.cwd(), "data", "demo", "client-asset-pack");

  const scenarios = [
    {
      target: "mappings",
      validFile: path.join(basePath, "mappings_valid.csv"),
      invalidFile: path.join(basePath, "mappings_invalid.csv"),
      expectedValidRows: 2,
    },
    {
      target: "groups",
      validFile: path.join(basePath, "groups_valid.csv"),
      invalidFile: path.join(basePath, "groups_invalid.csv"),
      expectedValidRows: 2,
    },
    {
      target: "parameters",
      validFile: path.join(basePath, "parameters_valid.csv"),
      invalidFile: path.join(basePath, "parameters_invalid.csv"),
      expectedValidRows: 2,
    },
  ];

  for (const scenario of scenarios) {
    const previewValid = await uploadPreview(baseUrl, cookie, scenario.target, scenario.validFile);
    if ((previewValid.summary?.validRows ?? 0) !== scenario.expectedValidRows) {
      throw new Error(`${scenario.target} valid preview rows mismatch`);
    }
    if (!previewValid.token || !previewValid.canConfirm) {
      throw new Error(`${scenario.target} valid preview did not return confirm token`);
    }

    const confirmValid = await uploadConfirm(baseUrl, cookie, previewValid.token);
    if ((confirmValid.imported ?? 0) !== scenario.expectedValidRows) {
      throw new Error(`${scenario.target} confirm imported mismatch`);
    }

    await expectConfirmReuseFails(baseUrl, cookie, previewValid.token);

    const previewInvalid = await uploadPreview(baseUrl, cookie, scenario.target, scenario.invalidFile);
    if ((previewInvalid.summary?.errors ?? 0) < 2) {
      throw new Error(`${scenario.target} invalid preview should report errors`);
    }
    if ((previewInvalid.summary?.duplicatesInFile ?? 0) < 1) {
      throw new Error(`${scenario.target} invalid preview should report duplicates`);
    }
  }

  console.log("import_suite=ok");
}

const env = loadEnv(".env");
const baseUrl = env.APP_BASE_URL || `http://127.0.0.1:${env.APP_PORT || "3003"}`;
const adminIdentifier = env.APP_ADMIN_USERNAME || env.APP_ADMIN_EMAIL;

if (!adminIdentifier || !env.APP_ADMIN_PASSWORD || !env.DATABASE_URL) {
  throw new Error("APP_ADMIN_USERNAME or APP_ADMIN_EMAIL, APP_ADMIN_PASSWORD and DATABASE_URL are required in env");
}

const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

let cookie = "";

try {
  await cleanupCasRecords(env.DATABASE_URL);

  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier: adminIdentifier, password: env.APP_ADMIN_PASSWORD }),
  });
  await ensureOk(loginResponse, "login");

  cookie = (loginResponse.headers.get("set-cookie") || "").split(";")[0];
  if (!cookie) throw new Error("no auth session cookie returned");

  await runEntityWorkflowSuite(baseUrl, cookie, stamp);
  await runImportSuite(baseUrl, cookie);

  console.log("E2E_CLIENT_ASSET_SUITE_OK");
} finally {
  await cleanupCasRecords(env.DATABASE_URL);
}
