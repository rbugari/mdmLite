import fs from "node:fs";

function loadEnv(path) {
  const env = {
    ...process.env,
  };

  if (!fs.existsSync(path)) {
    return env;
  }

  const txt = fs.readFileSync(path, "utf8");

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

async function fetchPending(cookie) {
  const response = await fetch(`${baseUrl}/api/workflow/pending`, {
    headers: { cookie },
  });
  return ensureOk(response, "fetch pending queue");
}

async function approveItem(item, cookie, stepLabel) {
  const response = await fetch(`${baseUrl}/api/workflow/transition`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({
      entity: item.entity,
      id: item.id,
      action: "approve",
      comments: stepLabel,
    }),
  });

  return ensureOk(response, `approve ${item.entity}`);
}

async function createAndApproveFirstPending({ entityName, createPath, createBody, keyMatcher, cookie }) {
  const createResponse = await fetch(`${baseUrl}${createPath}`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify(createBody),
  });
  await ensureOk(createResponse, `create ${entityName}`);

  const pending = await fetchPending(cookie);
  const first = (pending.items ?? []).find((item) => item.entity === entityName && keyMatcher(item.label));

  if (!first) {
    throw new Error(`first pending ${entityName} item was not found`);
  }

  const approveResult = await approveItem(first, cookie, `e2e-approve-initial-${entityName}`);
  if (approveResult.status !== "approved") {
    throw new Error(`initial ${entityName} approve did not end in approved status`);
  }

  return first;
}

async function updateApprovedRecord({ entityName, updatePath, updateBody, keyMatcher, oldId, cookie }) {
  const updateResponse = await fetch(`${baseUrl}${updatePath}`, {
    method: "PUT",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify(updateBody),
  });

  const updatePayload = await ensureOk(updateResponse, `update ${entityName}`);
  if (updatePayload.mode !== "non_destructive_replacement") {
    throw new Error(`${entityName} update did not return non_destructive_replacement mode`);
  }

  const pendingAfterUpdate = await fetchPending(cookie);
  const replacement = (pendingAfterUpdate.items ?? []).find(
    (item) => item.entity === entityName && keyMatcher(item.label) && item.id !== oldId,
  );

  if (!replacement) {
    throw new Error(`${entityName} replacement pending item was not found`);
  }

  const approveReplacement = await approveItem(replacement, cookie, `e2e-approve-replacement-${entityName}`);
  if (approveReplacement.status !== "approved") {
    throw new Error(`replacement ${entityName} approve did not end in approved status`);
  }

  if ((approveReplacement.autoInactivatedPrevious ?? 0) < 1) {
    throw new Error(`replacement ${entityName} approve did not auto-inactivate previous version`);
  }

  return replacement;
}

function assertActiveViewState(items, oldId, newId, entityName) {
  const oldVisible = items.some((x) => x.id === oldId);
  const newVisible = items.some((x) => x.id === newId);

  if (oldVisible || !newVisible) {
    throw new Error(
      `${entityName} active view mismatch: oldVisible=${String(oldVisible)} newVisible=${String(newVisible)}`,
    );
  }
}

const env = loadEnv(".env");
const appPort = env.APP_PORT || "3003";
const baseUrl = env.APP_BASE_URL || `http://127.0.0.1:${appPort}`;
const adminIdentifier = env.APP_ADMIN_USERNAME || env.APP_ADMIN_EMAIL;

if (!adminIdentifier || !env.APP_ADMIN_PASSWORD) {
  throw new Error("APP_ADMIN_USERNAME or APP_ADMIN_EMAIL, and APP_ADMIN_PASSWORD, are required in env.");
}

const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

const keys = {
  mapping: `YOLO_MAP_${stamp}`,
  group: `YOLO_GRP_${stamp}`,
  parameter: `YOLO_PAR_${stamp}`,
  scope: `YOLO_SCOPE_${stamp}`,
};

const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    identifier: adminIdentifier,
    password: env.APP_ADMIN_PASSWORD,
  }),
});

await ensureOk(loginResponse, "login");
const cookie = (loginResponse.headers.get("set-cookie") || "").split(";")[0];

if (!cookie) {
  throw new Error("login succeeded but no session cookie was returned");
}

console.log(`base_url=${baseUrl}`);

const firstMapping = await createAndApproveFirstPending({
  entityName: "mapping",
  createPath: "/api/mappings",
  createBody: {
    sourceValue: keys.mapping,
    targetValue: "TARGET_V1",
    validFrom: "2024-01-01",
    comments: "e2e mapping create",
  },
  keyMatcher: (label) => String(label).includes(keys.mapping),
  cookie,
});

const replacementMapping = await updateApprovedRecord({
  entityName: "mapping",
  updatePath: `/api/mappings/${firstMapping.id}`,
  updateBody: {
    sourceValue: keys.mapping,
    targetValue: "TARGET_V2",
    validFrom: "2024-02-01",
    comments: "e2e mapping update",
  },
  keyMatcher: (label) => String(label).includes(keys.mapping),
  oldId: firstMapping.id,
  cookie,
});

const mappingsActive = await ensureOk(
  await fetch(`${baseUrl}/api/mappings`, { headers: { cookie } }),
  "read active mappings",
);
assertActiveViewState(mappingsActive.items ?? [], firstMapping.id, replacementMapping.id, "mapping");
console.log("mapping_flow=ok");

const firstGroup = await createAndApproveFirstPending({
  entityName: "group",
  createPath: "/api/groups",
  createBody: {
    memberValue: keys.group,
    groupValue: "GROUP_V1",
    validFrom: "2024-01-01",
    comments: "e2e group create",
  },
  keyMatcher: (label) => String(label).includes(keys.group),
  cookie,
});

const replacementGroup = await updateApprovedRecord({
  entityName: "group",
  updatePath: `/api/groups/${firstGroup.id}`,
  updateBody: {
    memberValue: keys.group,
    groupValue: "GROUP_V2",
    validFrom: "2024-02-01",
    comments: "e2e group update",
  },
  keyMatcher: (label) => String(label).includes(keys.group),
  oldId: firstGroup.id,
  cookie,
});

const groupsActive = await ensureOk(
  await fetch(`${baseUrl}/api/groups`, { headers: { cookie } }),
  "read active groups",
);
assertActiveViewState(groupsActive.items ?? [], firstGroup.id, replacementGroup.id, "group");
console.log("group_flow=ok");

const firstParameter = await createAndApproveFirstPending({
  entityName: "parameter",
  createPath: "/api/parameters",
  createBody: {
    parameterKey: keys.parameter,
    parameterValue: "1.11",
    domain: "ventas_perseida",
    scopeType: "CLIENT",
    scopeValue: keys.scope,
    validFrom: "2024-01-01",
    comments: "e2e parameter create",
  },
  keyMatcher: (label) => String(label).includes(keys.parameter),
  cookie,
});

const replacementParameter = await updateApprovedRecord({
  entityName: "parameter",
  updatePath: `/api/parameters/${firstParameter.id}`,
  updateBody: {
    parameterKey: keys.parameter,
    parameterValue: "1.22",
    domain: "ventas_perseida",
    scopeType: "CLIENT",
    scopeValue: keys.scope,
    validFrom: "2024-02-01",
    comments: "e2e parameter update",
  },
  keyMatcher: (label) => String(label).includes(keys.parameter),
  oldId: firstParameter.id,
  cookie,
});

const parametersActive = await ensureOk(
  await fetch(`${baseUrl}/api/parameters`, { headers: { cookie } }),
  "read active parameters",
);
assertActiveViewState(parametersActive.items ?? [], firstParameter.id, replacementParameter.id, "parameter");
console.log("parameter_flow=ok");

console.log("E2E_NON_DESTRUCTIVE_OK");