# Trial Readiness Status

## Status Snapshot

Date: 2026-04-17

Current decision: trial-ready for the first controlled Windows-first trial.

Reason: the installable baseline now passes the official install/start path, remote PostgreSQL validation, smoke verification, and the consolidated scanner in `GO` state.

## What Passed In This Validation Round

### Installation And Runtime

1. `npm.cmd run env:check` passed
2. production build completed successfully after forcing runtime-dynamic app routes
3. the official Windows-first path `scripts\windows\install-and-start.bat` now reaches build successfully
4. the production launcher is aligned with `.next/standalone/server.js`
5. production smoke passed with:
   - root status `307`
   - DB health status `200`
   - SSL mode `require`

### Foundation Validation

1. `reports/remote-foundation-validation-latest.json` is `GO`
2. remote PostgreSQL validation now runs end-to-end with app reachable
3. demo reset endpoint validation passed in the remote validation flow

### Functional Validation

1. `typecheck` passed
2. `e2e:nondestructive` passed
3. `e2e:client-asset` passed after normalizing local runners to `127.0.0.1`
4. `e2e:ui-workflows` passed after fixing local production login persistence

## Blocking Failures

There are no remaining blocking failures for the controlled trial baseline in the current validation round.

## Consolidated Scanner Status

Current persisted result:

1. `reports/test-scan-latest.json` is `GO`
2. passed steps:
   - `typecheck`
   - `e2e:nondestructive`
   - `e2e:client-asset`
   - `e2e:ui-workflows`

## Release Checklist Assessment

### Installation Checklist

1. official first-run entrypoint documented: pass
2. guided `.env` flow available: pass
3. production install completes without repo archaeology: pass
4. production start on configured port: pass
5. docs aligned around installation path: pass

### Runtime Checklist

1. homepage responds: pass
2. `/api/health/db` returns `ok: true`: pass
3. runtime env validation passes: pass
4. browser login flow is demonstrable in current local production automation: pass
5. SSL mode is explicit and healthy: pass

### Functional Smoke Checklist

1. mapping flow demonstrable: pass
2. group flow demonstrable: pass
3. parameter flow demonstrable: pass
4. audit trail demonstrable: pass
5. active views demonstrable: pass

## Sign-Off Outcome

The installable trial baseline is now ready for the first controlled trial under the documented support boundary and accepted limitations.