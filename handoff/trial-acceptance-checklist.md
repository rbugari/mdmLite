# Trial Acceptance Checklist

## Objective

Provide one short acceptance path that should fit in roughly 10 minutes once PostgreSQL access is ready.

## Preparation

Before starting:

1. Node.js 22 LTS is installed
2. PostgreSQL host, database, user, password, and SSL mode are available
3. the project package is already unpacked locally

## Acceptance Steps

### 1. Install And Start

Run:

```bat
scripts\windows\install-and-start.bat
```

Pass condition:

1. the script finishes without errors
2. the app starts on the configured port

### 2. Run Smoke Test

Run:

```bat
scripts\windows\smoke-test.bat
```

Pass condition:

1. homepage check passes
2. `/api/health/db` returns `ok: true`
3. the reported SSL mode matches the intended environment

### 3. Login

Open:

```text
http://127.0.0.1:3003
```

Pass condition:

1. login page loads
2. admin login succeeds
3. authenticated home page is displayed

### 4. Core Functional Check

Verify these areas open successfully:

1. Mappings
2. Groups
3. Parameters
4. Approvals
5. Audit

Pass condition:

1. each page loads without obvious runtime failure
2. existing demo or seed data is visible if expected

### 5. Minimal Data Governance Check

Confirm at least one of these is visible:

1. approved active records
2. pending approval items
3. audit trail entries

Pass condition:

1. the product boundary is demonstrable end to end

## Optional DB Validation

If a direct SQL validation is needed, run the queries from `docs/trial-install-access-and-db-guide.md` against:

1. `vw_mdm_mapping_rule_active`
2. `vw_mdm_group_rule_active`
3. `vw_mdm_parameter_active`
4. `mdm_change_log`

## Final Acceptance Result

Accept the trial package if all of the following are true:

1. install path works without manual repo archaeology
2. smoke test passes
3. login works
4. core screens load
5. DB-backed rule data is visible

## If It Fails

Capture and send back:

1. the failing command
2. the full terminal output
3. the result of `npm run env:check`
4. the result of `scripts\windows\smoke-test.bat`
5. masked `.env` values related to the issue