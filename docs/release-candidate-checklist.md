# Release Candidate Checklist

## Objective

Provide a concrete go/no-go checklist for declaring the first controlled trial build ready.

## Required Scope For This Release Candidate

The release candidate is only intended for:

1. Windows-first customer-hosted installation
2. customer-owned PostgreSQL
3. web application delivery
4. controlled trial usage, not open distribution

## Entry Criteria

Before executing this checklist, the team should already have:

1. the current production build path working
2. the standalone launcher present at `.next/standalone/server.js`
3. a valid `.env` flow
4. a reachable PostgreSQL target
5. the current test reports available

## Installation Checklist

All items must pass:

1. `scripts\windows\install-and-start.bat` is the documented first-run entrypoint
2. `.env` can be created or repaired through the guided configurator
3. production install completes without manual repo archaeology
4. production build emits `.next/standalone/server.js`
5. production start succeeds on the configured `APP_PORT`
6. the installation path is consistent across `README.md` and Windows docs

## Runtime Checklist

All items must pass:

1. homepage responds successfully
2. `/api/health/db` reports `ok: true`
3. runtime env validation passes
4. admin login works with `APP_ADMIN_USERNAME` and `APP_ADMIN_PASSWORD`
5. the configured SSL mode is the intended one for the target environment

## Functional Smoke Checklist

All items must pass:

1. one mapping create and approval flow is demonstrable
2. one group create and approval flow is demonstrable
3. one parameter create and approval flow is demonstrable
4. audit trail is visible
5. active views remain queryable for approved data

## Evidence Checklist

The evidence package should include:

1. latest `reports/test-scan-latest.json`
2. latest `reports/e2e-ui-workflows-latest.json`
3. latest `reports/remote-foundation-validation-latest.json`
4. confirmation that the standalone launcher path was used for the latest production start rehearsal
5. date of the latest Windows-first install rehearsal
6. known limitations accepted for the trial

## Known Limitations Review

These must be explicitly reviewed before sign-off:

1. no one-click installer
2. no Windows service wrapper
3. no bundled Node runtime
4. no automatic upgrade and rollback flow
5. no enterprise IAM or broader RBAC model

## Go/No-Go Rule

Go only if all of the following are true:

1. installation path is clear and repeatable
2. validation evidence is current and green
3. smoke flow is demonstrable without ad hoc fixes
4. support boundary is documented
5. limitations are known and accepted

If any of those conditions fails, the build remains in foundation closure and is not yet trial-ready.

## Current Assessment

As of 2026-04-17, the release candidate is in `GO` state for the first controlled Windows-first trial.