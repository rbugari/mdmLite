import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";
import { Client } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const reportsDir = path.join(rootDir, "reports");
const reportPath = path.join(reportsDir, "e2e-ui-workflows-latest.json");
const artifactDir = path.join(reportsDir, "e2e-ui-workflows-artifacts");

function loadEnv(pathToEnv) {
  const txt = fs.readFileSync(pathToEnv, "utf8");
  const env = {};

  for (const line of txt.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) {
      env[match[1]] = match[2];
    }
  }

  return env;
}

function ensure(value, message) {
  assert.ok(value, message);
}

function stampValue() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

async function cleanupUiRecords(connectionString) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("begin");
    await client.query(`
      delete from mdm_change_log
      where record_id in (
        select id from mdm_mapping_rule where source_value like 'UI_%' or target_value like 'UI_%'
        union
        select id from mdm_group_rule where member_value like 'UI_%' or group_value like 'UI_%'
        union
        select id from mdm_parameter
        where parameter_key like 'UI_%'
           or parameter_scope_value like 'UI_%'
           or parameter_value like 'UI_%'
      )
         or comments ilike 'ui-e2e%'
    `);
    await client.query("delete from mdm_mapping_rule where source_value like 'UI_%' or target_value like 'UI_%'");
    await client.query("delete from mdm_group_rule where member_value like 'UI_%' or group_value like 'UI_%'");
    await client.query(`
      delete from mdm_parameter
      where parameter_key like 'UI_%'
         or parameter_scope_value like 'UI_%'
         or parameter_value like 'UI_%'
    `);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

async function waitForBodyText(page, text, timeout = 15000) {
  await page.waitForFunction(
    (expectedText) => document.body.innerText.includes(expectedText),
    text,
    { timeout },
  );
}

async function waitForBodyTextMissing(page, text, timeout = 15000) {
  await page.waitForFunction(
    (expectedText) => !document.body.innerText.includes(expectedText),
    text,
    { timeout },
  );
}

async function settleClientPage(page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
}

async function login(page, email, password) {
  await page.goto("/auth/login", { waitUntil: "domcontentloaded" });
  await settleClientPage(page);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/$/, { timeout: 15000 });
  await waitForBodyText(page, "Launch status");
}

async function createMapping(page, sourceValue, targetValue, validFrom, comments) {
  await page.goto("/mappings", { waitUntil: "domcontentloaded" });
  await settleClientPage(page);
  const panel = page.locator("section.table-panel").filter({ has: page.getByRole("heading", { name: "New mapping" }) });
  await panel.locator('input[name="sourceValue"]').fill(sourceValue);
  await panel.locator('input[name="targetValue"]').fill(targetValue);
  await panel.locator('input[name="validFrom"]').fill(validFrom);
  await panel.locator('input[name="comments"]').fill(comments);
  await panel.getByRole("button", { name: "Create mapping" }).click();
  await waitForBodyText(page, "Mapping created successfully.");
}

async function createGroup(page, memberValue, groupValue, validFrom, comments) {
  await page.goto("/groups", { waitUntil: "domcontentloaded" });
  await settleClientPage(page);
  const panel = page.locator("section.table-panel").filter({ has: page.getByRole("heading", { name: "New group" }) });
  await panel.locator('input[name="memberValue"]').fill(memberValue);
  await panel.locator('input[name="groupValue"]').fill(groupValue);
  await panel.locator('input[name="validFrom"]').fill(validFrom);
  await panel.locator('input[name="comments"]').fill(comments);
  await panel.getByRole("button", { name: "Create group" }).click();
  await waitForBodyText(page, "Group created successfully.");
}

async function createParameter(page, parameterKey, parameterValue, domain, scopeType, scopeValue, validFrom, comments) {
  await page.goto("/parameters", { waitUntil: "domcontentloaded" });
  await settleClientPage(page);
  const panel = page.locator("section.table-panel").filter({ has: page.getByRole("heading", { name: "New parameter" }) });
  await panel.locator('input[name="parameterKey"]').fill(parameterKey);
  await panel.locator('input[name="parameterValue"]').fill(parameterValue);
  await panel.locator('input[name="domain"]').fill(domain);
  await panel.locator('input[name="scopeType"]').fill(scopeType);
  await panel.locator('input[name="scopeValue"]').fill(scopeValue);
  await panel.locator('input[name="validFrom"]').fill(validFrom);
  await panel.locator('input[name="comments"]').fill(comments);
  await panel.getByRole("button", { name: "Create parameter" }).click();
  await waitForBodyText(page, "Parameter created successfully.");
}

async function openApprovalRow(page, type, searchValue) {
  await page.goto("/approvals", { waitUntil: "domcontentloaded" });
  await settleClientPage(page);
  const filter = page.getByLabel("Filter by rule type");
  const search = page.getByPlaceholder("Search pending rule");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await filter.selectOption(type);
    await search.fill(searchValue);

    try {
      await waitForBodyText(page, searchValue, 10000);
      return page.locator("table tbody tr").filter({ hasText: searchValue }).first();
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }

      await page.getByRole("button", { name: /refresh queue|refreshing/i }).click();
      await settleClientPage(page);
    }
  }

  return page.locator("table tbody tr").filter({ hasText: searchValue }).first();
}

async function applyApprovalAction(page, type, searchValue, actionName) {
  const row = await openApprovalRow(page, type, searchValue);
  await row.getByRole("button", { name: actionName }).click();
  await waitForBodyTextMissing(page, searchValue, 20000);
}

async function filterList(page, route, queryText, pageSize) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await settleClientPage(page);
  await page.locator('form.filter-form input[name="q"]').fill(queryText);
  await page.locator("form.filter-form").getByRole("button", { name: "Filter" }).click();
  await page.waitForURL((url) => url.searchParams.get("q") === queryText, { timeout: 15000 });

  if (pageSize) {
    await page.locator('select[name="pageSize"]').selectOption(String(pageSize));
    await page.getByRole("button", { name: "Apply" }).click();
    await page.waitForURL((url) => url.searchParams.get("pageSize") === String(pageSize), { timeout: 15000 });
  }
}

async function writeImportFile(filePath, stamp) {
  const content = [
    "source_value,target_value,activo",
    `UI_IMPORT_${stamp}_A,UI_IMPORT_TARGET_${stamp}_A,1`,
    `UI_IMPORT_${stamp}_B,UI_IMPORT_TARGET_${stamp}_B,1`,
  ].join("\n");

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${content}\n`, "utf8");
}

function languageGroup(page) {
  return page.locator(".site-control-group");
}

async function main() {
  const env = loadEnv(envPath);
  const baseUrl = `http://localhost:${env.APP_PORT ?? "3003"}`;
  const stamp = stampValue();
  const report = {
    generatedAt: new Date().toISOString(),
    overall: "GO",
    baseUrl,
    steps: [],
  };

  let browser;
  let page;
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.mkdirSync(artifactDir, { recursive: true });

  async function runStep(name, action) {
    const startedAt = Date.now();
    process.stdout.write(`ui_step_start=${name}\n`);

    try {
      await action();
      report.steps.push({ name, ok: true, durationMs: Date.now() - startedAt });
      process.stdout.write(`ui_step_ok=${name}\n`);
    } catch (error) {
      report.overall = "NO_GO";
      report.steps.push({
        name,
        ok: false,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      });

      if (page) {
        const safeName = name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
        await page.screenshot({ path: path.join(artifactDir, `${safeName}.png`), fullPage: true });
      }

      throw error;
    }
  }

  try {
    ensure(env.DATABASE_URL, "DATABASE_URL is required");
    ensure(env.APP_ADMIN_EMAIL, "APP_ADMIN_EMAIL is required");
    ensure(env.APP_ADMIN_PASSWORD, "APP_ADMIN_PASSWORD is required");

    await runStep("server-health", async () => {
      const response = await fetch(`${baseUrl}/api/health/db`);
      const payload = await response.json();
      ensure(response.ok && payload.ok, "Application server or database health check is failing");
    });

    await cleanupUiRecords(env.DATABASE_URL);

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: baseUrl });
    page = await context.newPage();

    await runStep("login-theme-language", async () => {
      await login(page, env.APP_ADMIN_EMAIL, env.APP_ADMIN_PASSWORD);

      const initialTheme = await page.locator("html").getAttribute("data-theme");
      await page.getByRole("button", { name: "Switch color theme" }).click();
      await page.waitForFunction((previousTheme) => document.documentElement.dataset.theme !== previousTheme, initialTheme);
      const toggledTheme = await page.locator("html").getAttribute("data-theme");
      ensure(toggledTheme && toggledTheme !== initialTheme, "Theme toggle did not change the theme");

      await page.reload({ waitUntil: "domcontentloaded" });
      await settleClientPage(page);
      ensure((await page.locator("html").getAttribute("data-theme")) === toggledTheme, "Theme did not persist after reload");

      await languageGroup(page).getByRole("button", { name: "ES", exact: true }).click();
      await page.waitForFunction(() => document.documentElement.lang === "es");
      await page.reload({ waitUntil: "domcontentloaded" });
      await settleClientPage(page);
      ensure((await page.locator("html").getAttribute("lang")) === "es", "Language did not persist after reload");

      await languageGroup(page).getByRole("button", { name: "EN", exact: true }).click();
      await page.waitForFunction(() => document.documentElement.lang === "en");
    });

    await runStep("help-pages", async () => {
      await page.goto("/help", { waitUntil: "domcontentloaded" });
      await settleClientPage(page);
      await waitForBodyText(page, "How to understand MDM Lite from business, data engineering, and architecture");
      await page.getByRole("link", { name: "Functional Guide" }).first().click();
      await page.waitForURL(/\/help\/functional$/);
      await settleClientPage(page);
      await waitForBodyText(page, "What each option does and how to use it in a real ETL scenario");
      await page.goto("/help/platforms", { waitUntil: "domcontentloaded" });
      await settleClientPage(page);
      await waitForBodyText(page, "How it fits in Databricks, Fabric, Snowflake, and modern architectures");
      await page.goto("/help/positioning", { waitUntil: "domcontentloaded" });
      await settleClientPage(page);
      await waitForBodyText(page, "How it positions itself against Purview, Unity Catalog, and other tools");
    });

    const mappingRejectSource = `UI_MAP_REJECT_${stamp}`;
    await runStep("mapping-create-reject-approvals-search", async () => {
      await createMapping(page, mappingRejectSource, `UI_TARGET_REJECT_${stamp}`, "2024-01-01", "ui-e2e mapping reject");
      await applyApprovalAction(page, "mapping", mappingRejectSource, "Reject");
    });

    const groupMember = `UI_GROUP_MEMBER_${stamp}`;
    const groupValue = `UI_GROUP_VALUE_${stamp}`;
    await runStep("group-create-approve-list-filters", async () => {
      await createGroup(page, groupMember, groupValue, "2024-01-01", "ui-e2e group approve");
      await applyApprovalAction(page, "group", groupMember, "Approve");
      await filterList(page, "/groups", groupMember, 10);
      await waitForBodyText(page, groupMember);
      await waitForBodyText(page, groupValue);
      await waitForBodyText(page, "size=10");
    });

    const parameterScopeValue = `UI_SCOPE_${stamp}`;
    const parameterKey = `UI_PARAM_${stamp}`;
    await runStep("parameter-create-approve-list-filters", async () => {
      await createParameter(
        page,
        parameterKey,
        `UI_VALUE_${stamp}`,
        "ventas_perseida",
        "CLIENT",
        parameterScopeValue,
        "2024-01-01",
        "ui-e2e parameter approve",
      );
      await applyApprovalAction(page, "parameter", parameterKey, "Approve");
      await filterList(page, "/parameters", parameterKey, 10);
      await waitForBodyText(page, parameterScopeValue);
      await waitForBodyText(page, parameterKey);
    });

    const mappingEditSource = `UI_MAP_EDIT_${stamp}`;
    const mappingEditTargetV1 = `UI_TARGET_V1_${stamp}`;
    const mappingEditTargetV2 = `UI_TARGET_V2_${stamp}`;
    await runStep("mapping-edit-replacement-history-audit", async () => {
      await createMapping(page, mappingEditSource, mappingEditTargetV1, "2024-01-01", "ui-e2e mapping replacement base");
      await applyApprovalAction(page, "mapping", mappingEditSource, "Approve");

      await filterList(page, "/mappings", mappingEditSource, 10);
      const row = page.locator("table tbody tr").filter({ hasText: mappingEditSource }).first();
      await row.getByRole("button", { name: "Edit" }).click();

      const editRow = page.locator("tr.edit-row");
      await editRow.locator('input[name="targetValue"]').fill(mappingEditTargetV2);
      await editRow.locator('input[name="validFrom"]').fill("2024-02-01");
      await editRow.locator('input[name="comments"]').fill("ui-e2e mapping replacement edit");
      await editRow.getByRole("button", { name: "Save changes" }).click();

      await applyApprovalAction(page, "mapping", mappingEditSource, "Approve");

      await filterList(page, "/mappings", mappingEditSource, 10);
      await waitForBodyText(page, mappingEditTargetV2);

      const updatedRow = page.locator("table tbody tr").filter({ hasText: mappingEditSource }).first();
      await updatedRow.getByRole("link", { name: "History" }).click();
      await page.waitForURL(/\/audit\?recordId=/, { timeout: 15000 });
      await waitForBodyText(page, "Audit trail");
      await waitForBodyText(page, "approve");
      await page.locator('select[name="action"]').selectOption("approve");
      await page.getByRole("button", { name: "Apply filters" }).click();
      await page.waitForURL((url) => url.pathname === "/audit" && url.searchParams.get("action") === "approve", { timeout: 15000 });
      await waitForBodyText(page, "approve");
    });

    await runStep("imports-demo-and-upload", async () => {
      const importFile = path.join(artifactDir, `ui-mappings-${stamp}.csv`);
      await writeImportFile(importFile, stamp);

      await page.goto("/imports", { waitUntil: "domcontentloaded" });
      await settleClientPage(page);
      await page.getByRole("button", { name: "Import server demo" }).click();
      await waitForBodyText(page, "Import completed successfully.", 60000);

      await page.locator('select[name="target"]').selectOption("mappings");
      await page.locator('input[type="file"]').setInputFiles(importFile);
      await page.getByRole("button", { name: "Preview import" }).click();
      await waitForBodyText(page, "Preview generated.", 30000);
      await waitForBodyText(page, "rows=2 valid=2 errors=0", 30000);

      await page.getByRole("button", { name: "Confirm import" }).click();
      await waitForBodyText(page, "Import completed successfully.", 30000);

      await filterList(page, "/mappings", `UI_IMPORT_${stamp}_A`, 10);
      await waitForBodyText(page, `UI_IMPORT_${stamp}_A`);
      await waitForBodyText(page, `UI_IMPORT_TARGET_${stamp}_A`);
    });

    await runStep("logout-and-protected-route", async () => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await settleClientPage(page);
      await page.getByRole("button", { name: "Logout" }).click();
      await page.waitForURL(/\/auth\/login/, { timeout: 15000 });
      await waitForBodyText(page, "Admin login");

      const cookiesAfterLogout = await page.context().cookies(baseUrl);
      ensure(!cookiesAfterLogout.some((cookie) => cookie.name === "mdm_session"), "Session cookie still exists after logout");

      await page.goto("/approvals", { waitUntil: "domcontentloaded" });
      await settleClientPage(page);

      if (/\/auth\/login/.test(page.url())) {
        await waitForBodyText(page, "Admin login");
      } else {
        await waitForBodyText(page, "Admin login");
      }
    });

    await cleanupUiRecords(env.DATABASE_URL);
  } catch (error) {
    report.error = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    if (browser) {
      await browser.close();
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});