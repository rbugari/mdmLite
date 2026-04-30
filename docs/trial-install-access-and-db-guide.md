# Trial Install, Access And DB Guide

## Objective

Provide one practical handoff guide for:

1. installing MDM Lite on another Windows machine
2. delivering the minimum package for a controlled trial
3. connecting directly to PostgreSQL for validation

## 1. How To Access The Running App Now

If the application is already running on this machine, open:

```text
http://127.0.0.1:3003
```

Login with the credentials defined in `.env`:

1. `APP_ADMIN_USERNAME`
2. `APP_ADMIN_PASSWORD`

Quick health check:

```text
http://127.0.0.1:3003/api/health/db
```

Expected result:

1. HTTP app responds
2. JSON contains `ok: true`

## 2. How To Install On Another Windows PC

### Prerequisites

The target machine needs:

1. Windows 10 or newer
2. Node.js 22 LTS installed and available in `PATH`
3. npm available in `PATH`
4. network access to the PostgreSQL server
5. one PostgreSQL database and user ready for the app

### Simplest Supported Install Path

From the project root, run:

```bat
scripts\windows\install-and-start.bat
```

That script is the official first-run entrypoint and performs:

1. guided `.env` setup if missing or incomplete
2. dependency install
3. schema apply on PostgreSQL
4. production build
5. production startup using the standalone launcher

### Minimum Runtime Values

The guided configurator will generate these values, but the minimum shape is:

```env
DATABASE_URL=postgresql://user:pass@host:5432/mdm_lite?sslmode=verify-full
DATABASE_SSL_MODE=require
APP_ADMIN_USERNAME=admin
APP_ADMIN_EMAIL=admin@example.com
APP_ADMIN_PASSWORD=change-this-password
APP_AUTH_SECRET=change-this-secret-now
APP_PORT=3003
```

### If You Prefer To Run By Phases

Run these in order:

```bat
scripts\windows\configure-production.bat
scripts\windows\check-db-connection.bat
scripts\windows\install-production.bat
scripts\windows\start-production.bat
scripts\windows\smoke-test.bat
```

Use this phased path when:

1. you want to review `.env` first
2. you want to validate PostgreSQL before schema apply and build
3. you want to separate install from startup
4. you want a repeatable maintenance flow after the first run

### Recommended PostgreSQL Validation Before Install

After creating `.env`, run:

```bat
scripts\windows\check-db-connection.bat
```

Expected result:

1. JSON with `ok: true`
2. the expected host, port, database, and user
3. the expected SSL mode

If that check fails, do not continue with install until `DATABASE_URL` and `DATABASE_SSL_MODE` are corrected.

### After Installation

Open:

```text
http://127.0.0.1:3003
```

If `APP_PORT` changed in `.env`, use that port instead.

## 3. Minimum Delivery Package For A Controlled Trial

For a customer-hosted or internal controlled trial, the minimum package should include:

1. the repository snapshot or release zip
2. `README.md`
3. `docs/windows-installation.md`
4. `docs/trial-support-baseline.md`
5. `docs/trial-known-limitations.md`
6. `docs/trial-readiness-status.md`
7. the latest validation reports under `reports/`

### Recommended Delivery Contents

Deliver these folders and files together:

1. `src/`
2. `scripts/`
3. `db/`
4. `data/` if the demo scenario is included
5. `docs/`
6. `package.json`
7. `package-lock.json` if present
8. `next.config.ts`
9. `tsconfig.json`
10. `eslint.config.mjs`

### What To Tell The Trial Operator

The operator only needs four core instructions:

1. install Node.js 22 LTS
2. prepare PostgreSQL and connection string
3. run `scripts\windows\install-and-start.bat`
4. verify with `scripts\windows\smoke-test.bat`

### What Is Not Included Yet

This delivery package is not yet:

1. an MSI installer
2. a Windows service package
3. a bundled Node.js runtime
4. an automatic upgrade or rollback package

## 4. How To Connect Directly To PostgreSQL

You can connect with any PostgreSQL client.

Common options:

1. `psql`
2. pgAdmin
3. DBeaver
4. DataGrip

### Using psql

General form:

```bat
psql "postgresql://user:pass@host:5432/dbname?sslmode=verify-full"
```

If your environment uses a temporary fallback for certificates:

```bat
psql "postgresql://user:pass@host:5432/dbname?sslmode=require"
```

Use the same host, database, user, port, and SSL behavior defined by `DATABASE_URL`.

### What To Validate First

Once connected, list the main tables:

```sql
\dt mdm_*
```

List the active views:

```sql
\dv vw_mdm_*
```

Main operational tables:

1. `mdm_mapping_rule`
2. `mdm_group_rule`
3. `mdm_parameter`
4. `mdm_import_batch`
5. `mdm_import_item`
6. `mdm_change_log`

Main consumption views:

1. `vw_mdm_mapping_rule_active`
2. `vw_mdm_group_rule_active`
3. `vw_mdm_parameter_active`

### Basic Validation Queries

Check approved active mappings:

```sql
select *
from vw_mdm_mapping_rule_active
order by rule_set_code, entity_type_code, source_value
limit 20;
```

Check approved active groups:

```sql
select *
from vw_mdm_group_rule_active
order by rule_set_code, entity_type_code, member_value
limit 20;
```

Check approved active parameters:

```sql
select *
from vw_mdm_parameter_active
order by parameter_key, parameter_scope_type, parameter_scope_value
limit 20;
```

Check pending workflow items in base tables:

```sql
select id, source_value, target_value, status, is_active, valid_from, valid_to
from mdm_mapping_rule
where status <> 'approved'
order by valid_from desc
limit 20;
```

Check recent audit trail:

```sql
select table_name, action_type, approval_status, changed_at, comments
from mdm_change_log
order by changed_at desc
limit 30;
```

### Quick Sanity Counts

```sql
select 'mapping_active' as metric, count(*) from vw_mdm_mapping_rule_active
union all
select 'group_active' as metric, count(*) from vw_mdm_group_rule_active
union all
select 'parameter_active' as metric, count(*) from vw_mdm_parameter_active;
```

## 5. Recommended Handoff Sequence

For a trial handoff, use this sequence:

1. send the delivery package
2. share the PostgreSQL connection data securely
3. ask the operator to run `scripts\windows\install-and-start.bat`
4. ask the operator to run `scripts\windows\smoke-test.bat`
5. ask the operator to open the app and login with `APP_ADMIN_USERNAME`
6. if needed, validate records directly with the SQL queries above

## 6. Current Boundary

This guide assumes the current supported baseline:

1. Windows-first installation
2. customer-hosted web runtime
3. customer-owned PostgreSQL
4. foreground process execution
5. documented batch-script startup path