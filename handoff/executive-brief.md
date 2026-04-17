# MDM Lite Trial Executive Brief

## What This Is

MDM Lite is ready for a first controlled Windows-first trial as a lightweight governed rule store for mappings, groups, and parameters backed by PostgreSQL.

It is intended for teams that need to stop managing operational rules in spreadsheets, scattered SQL, or embedded code.

## What The Trial Proves

This trial is meant to validate:

1. installability in a supported Windows environment
2. clean connectivity to customer-owned PostgreSQL
3. admin maintenance of governed rules through the UI
4. lightweight approval and audit controls
5. SQL consumption of approved active records

## What Is Included Now

The current baseline includes:

1. Windows-first scripted installation
2. guided runtime configuration through `.env`
3. standalone production startup
4. smoke validation for app and DB health
5. governed CRUD flows for mappings, groups, and parameters
6. approval queue and audit trail
7. SQL active views for downstream technical consumption

## Validation Status

The current baseline is in `GO` state.

Evidence includes:

1. green production build
2. green Windows production start path
3. green smoke validation
4. green browser workflow validation
5. green consolidated validation scanner
6. green remote PostgreSQL foundation validation

## Supported First-Run Path

On the target Windows machine, run:

```bat
scripts\windows\install-and-start.bat
```

That flow configures the environment, installs dependencies, applies schema, builds the app, and starts the runtime.

## Access Path

Open:

```text
http://127.0.0.1:3003
```

Then login with the admin credentials defined during setup.

## Current Boundary

This is a controlled trial baseline, not a finished packaged product.

It does not yet include:

1. MSI or one-click installer packaging
2. Windows service installation
3. bundled Node.js runtime
4. automatic upgrade or rollback
5. enterprise IAM or broader RBAC

## What To Send With The Trial

The minimum handoff should include:

1. the project package
2. Windows installation instructions
3. support baseline and known limitations
4. latest validation reports
5. PostgreSQL validation guidance when technical review is expected

## Immediate Next Step

Hand the package to a controlled tester, run the documented install path, and capture feedback on installability, operational clarity, and product fit.