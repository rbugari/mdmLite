# Windows Installation Baseline

This document defines the first supported installation path for MDM Lite on Windows.

## Scope

This baseline is designed for:

- a customer-hosted web application
- a customer-owned PostgreSQL database
- a Windows operator with Node.js installed
- manual installation without Docker, MSI, or service wrappers

It is not yet a one-click installer. It is the controlled first step toward that outcome.

## Packaging For Delivery

For a controlled trial, the current recommended deliverable is a ZIP package, not an MSI.

Generate it with:

```bat
scripts\windows\create-trial-package.bat
```

That command creates:

1. a staging folder under `dist\trial-package\mdm-lite-trial`
2. a distributable ZIP under `dist\trial-package\mdm-lite-windows-trial.zip`

The ZIP is intended for an operator who will then run `scripts\windows\install-and-start.bat` on the target machine.

For the operator-facing steps, hand off:

1. `handoff/windows-operator-step-by-step-es.md`
2. `handoff/windows-quick-start-es.md`
2. `docs/windows-installation.md`
3. `docs/trial-install-access-and-db-guide.md`

The generated ZIP also places these operator guides at the package root with prominent names:

1. `LEER-PRIMERO-INSTALACION.md`
2. `LEER-DETALLADO-INSTALACION.md`

## Prerequisites

- Windows 10 or newer
- Node.js 22 LTS or compatible runtime available in `PATH`
- npm available in `PATH`
- Network access to the target PostgreSQL server
- A PostgreSQL database/user prepared for the application

## Minimal Environment

You can generate `.env` interactively with:

```bat
scripts\windows\configure-production.bat
```

If you prefer to inspect the target values, the minimum resulting environment is:

```env
DATABASE_URL=postgresql://user:pass@host:5432/mdm_lite?sslmode=verify-full
DATABASE_SSL_MODE=require
APP_ADMIN_USERNAME=admin
APP_ADMIN_EMAIL=admin@example.com
APP_ADMIN_PASSWORD=change-this-password
APP_AUTH_SECRET=change-this-secret-now
APP_PORT=3003
```

Guidance:

- Use `DATABASE_SSL_MODE=require` for managed PostgreSQL with valid certificates.
- Prefer `sslmode=verify-full` in `DATABASE_URL` for managed PostgreSQL so Node.js and `pg` keep certificate validation behavior explicit.
- Use `DATABASE_SSL_MODE=disable` for trusted local/private setups.
- Use `DATABASE_SSL_MODE=no-verify` only as a temporary compatibility fallback.
- If `/api/health/db` reports `self-signed certificate in certificate chain`, the current certificate cannot be validated by Node.js with `require`; for customer trials, move temporarily to `no-verify` only if that matches the customer's security policy.

## Installation

Recommended first run:

```bat
scripts\windows\install-and-start.bat
```

This is the official first-run entrypoint for the Windows trial baseline.

That single entrypoint will:

1. open the configurator if `.env` is missing or invalid
2. install dependencies
3. apply the PostgreSQL schema
4. build the production app
5. start the standalone server

If you want to run each phase separately instead, use:

```bat
scripts\windows\configure-production.bat
scripts\windows\install-production.bat
```

Those scripts are supported as separated maintenance steps, but they are not the primary first-time install path.

If `.env` does not exist, or if it is incomplete, `install-production.bat` will launch the configurator automatically.

Run:

```bat
scripts\windows\install-production.bat
```

That script performs five steps:

1. creates or repairs `.env` when required
2. validates required runtime environment variables
3. installs dependencies
4. verifies PostgreSQL connectivity with the configured SSL mode
5. applies the PostgreSQL schema
6. creates the production build and verifies `.next/standalone/server.js`

If you want to validate the database connection before the full install, run:

```bat
scripts\windows\check-db-connection.bat
```

That preflight check is the fastest way to confirm that:

1. `DATABASE_URL` points to the correct host, port, database, and user
2. `DATABASE_SSL_MODE` matches the target PostgreSQL SSL posture
3. the target machine can reach the PostgreSQL server over the network

## Startup

Run:

```bat
scripts\windows\start-production.bat
```

The application will start on `APP_PORT` from `.env` using the generated standalone server under `.next/standalone`.

## Smoke Test

With the app running, execute:

```bat
scripts\windows\smoke-test.bat
```

The smoke test checks:

- the HTTP entrypoint is reachable
- the database health endpoint returns `ok: true`
- the runtime reports the active SSL mode

## Current Limits

This baseline still depends on:

- an interactive `.env` setup step
- an installed Node.js runtime
- foreground process execution

Not implemented yet:

- Windows service installation
- one-click installer packaging
- bundled Node runtime
- automatic upgrade/rollback flow

## Recommended Next Installer Milestone

If you need a real Windows installer after the trial baseline, the next pragmatic step is:

1. keep `install-and-start.bat` as the install engine
2. wrap the delivery ZIP with an EXE installer
3. use the EXE only to unpack files, create shortcuts, and launch the existing install flow

For this project stage, that is lower risk than jumping directly to a full MSI with service management.