# Release Note - Trial Baseline

## MDM Lite Trial Baseline

This update closes the first Windows-first controlled trial baseline for MDM Lite.

## Included In This Baseline

1. production startup aligned with the standalone Next.js launcher
2. official Windows install path through `scripts\windows\install-and-start.bat`
3. guided runtime configuration through `.env`
4. smoke validation for HTTP and DB health
5. browser workflow validation in `GO` state
6. consolidated scanner in `GO` state
7. remote PostgreSQL validation in `GO` state
8. trial readiness, support, and known-limitations documentation
9. handoff package materials for testers and stakeholders

## Operational Result

The current baseline is ready for a first controlled trial with:

1. Windows-first installation
2. customer-owned PostgreSQL
3. admin login and governed CRUD flows
4. approval queue and audit trail
5. SQL active-view consumption

## Known Boundaries

This baseline does not yet include:

1. MSI or one-click installer packaging
2. Windows service installation
3. bundled Node.js runtime
4. automatic upgrade or rollback
5. enterprise IAM or broader RBAC

## Recommended Next Move

Use this baseline with a controlled tester or early customer environment, execute the documented install path, and capture feedback on installability, supportability, and product fit.