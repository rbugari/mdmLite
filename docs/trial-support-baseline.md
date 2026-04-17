# Trial Support Baseline

## Objective

Define the minimum support posture for the first controlled MDM Lite trial.

## Support Boundary

This phase supports:

1. Windows-first installation using the documented scripts
2. customer-hosted web runtime
3. customer-owned PostgreSQL
4. guided `.env` setup and validation
5. smoke validation of homepage, DB health, login, and core flows

This phase does not support:

1. custom deployment topologies outside the documented path
2. enterprise IAM integration
3. multi-tenant operation
4. platform-specific connectors
5. public website or broader product-family presentation work

## First-Response Diagnostics

When a trial issue is reported, request these artifacts first:

1. exact script being executed
2. console output from the failing step
3. relevant `.env` values with secrets masked
4. result of `npm run env:check`
5. result of `scripts\windows\smoke-test.bat` if the app is already running
6. latest relevant report under `reports/`

## Common Failure Classes

### 1. Environment Configuration

Symptoms:

1. `env:check` fails
2. login does not work
3. runtime starts on an unexpected port

First response:

1. run `scripts\windows\configure-production.bat`
2. rerun `npm run env:check`
3. confirm `APP_ADMIN_USERNAME`, `APP_ADMIN_PASSWORD`, and `APP_PORT`

### 2. Database Reachability

Symptoms:

1. schema apply fails
2. DB health endpoint fails
3. startup works but runtime reports DB errors

First response:

1. validate `DATABASE_URL`
2. confirm network reachability to PostgreSQL host and port
3. confirm user/database permissions

### 3. SSL And Certificate Handling

Symptoms:

1. `self-signed certificate in certificate chain`
2. remote PostgreSQL works only with insecure settings

First response:

1. confirm `DATABASE_SSL_MODE`
2. confirm `sslmode` in `DATABASE_URL`
3. use `require` plus `sslmode=verify-full` for managed PostgreSQL with valid certificates
4. use `no-verify` only as a temporary controlled fallback

### 4. Production Startup

Symptoms:

1. build is missing
2. app does not start after install
3. start script fails immediately

First response:

1. run the official first-run path `scripts\windows\install-and-start.bat`
2. if the environment is already configured, rerun `scripts\windows\install-production.bat`
3. confirm `.next\BUILD_ID` exists after build

### 5. Application Validation

Symptoms:

1. app opens but login or core workflows fail
2. smoke passes partially but CRUD flow is broken

First response:

1. run `scripts\windows\smoke-test.bat`
2. review latest validation reports under `reports/`
3. rerun the targeted validation script before broader debugging

## Support Working Rules

During the first trial:

1. fix installability and validation blockers first
2. do not expand scope into new product features under support pressure
3. prefer documented scripts over manual one-off remediation
4. convert recurring issues into documentation updates immediately

## Escalation Rule

Escalate a trial issue when any of the following is true:

1. the issue blocks installation for a supported environment
2. the issue breaks the documented smoke path
3. the issue invalidates the active-view contract
4. the issue requires changing the supported boundary

## Trial Exit Condition

The support baseline is considered adequate when a controlled trial can be run with:

1. one documented installation path
2. one documented smoke path
3. one documented first-response support path
4. explicit knowledge of what is and is not supported