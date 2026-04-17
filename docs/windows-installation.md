# Windows Installation Baseline

This document defines the first supported installation path for MDM Lite on Windows.

## Scope

This baseline is designed for:

- a customer-hosted web application
- a customer-owned PostgreSQL database
- a Windows operator with Node.js installed
- manual installation without Docker, MSI, or service wrappers

It is not yet a one-click installer. It is the controlled first step toward that outcome.

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
4. applies the PostgreSQL schema
5. creates the production build and verifies `.next/standalone/server.js`

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