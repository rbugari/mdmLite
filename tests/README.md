# Tests - MDM Lite v2

## Overview

Test suite for MDM Lite v2 with comprehensive E2E coverage for all workflows.

## Running Tests

### Single Suite
```bash
# Type checking
npm run typecheck

# Non-destructive workflow (create → approve → replace → approve → verify inactivation)
npm run e2e:nondestructive

# Client entity comprehensive asset pack (21 workflows + 3 import scenarios)
npm run e2e:client-asset

# Browser-visible admin workflows, including candidate batch history/detail/export
npm run e2e:ui-workflows
```

### Global Scanner (Pre-Demo/Release)
```bash
npm run test:scan
```

Executes all four suites in sequence and generates a GO/NO_GO report to `reports/test-scan-latest.json`.

**Expected output:**
```json
{
  "overall": "GO",
  "totalDurationMs": 30000,
  "steps": [
    { "script": "typecheck", "ok": true, "durationMs": 2600 },
    { "script": "e2e:nondestructive", "ok": true, "durationMs": 9800 },
    { "script": "e2e:client-asset", "ok": true, "durationMs": 16200 },
    { "script": "e2e:ui-workflows", "ok": true, "durationMs": 210000 }
  ]
}
```

## Test Structure

### [scripts/e2e-nondestructive.mjs](../scripts/e2e-nondestructive.mjs)
- **Purpose:** Core non-destructive replacement workflow
- **Coverage:**
  - Create mapping/group/parameter
  - Approve initial
  - Update approved record → triggers non_destructive_replacement mode
  - Approve replacement
  - Verify old version is inactivated
  - Verify new version is active

### [scripts/e2e-client-asset-suite.mjs](../scripts/e2e-client-asset-suite.mjs)
- **Purpose:** Comprehensive CLIENT entity simulation with all use cases
- **Coverage:**
  - **7 Workflow scenarios** (per entity: mappings, groups, parameters):
    1. Create + Approve → Visible
    2. Replace approved → New pending → Approve → Old hidden, new visible, old auto-inactivated
    3. Reject pending → Rejected status
    4. Inactivate approved → Hidden from active view
    5. Approve future-dated → Not visible until date passes
  - **3 Import scenarios:**
    1. Valid CSV preview → Valid token + Confirm → Imported count matches
    2. Token reuse → Fails (one-time use)
    3. Invalid CSV preview → Error/duplicate detection shown
  - **Auto cleanup:** Deletes CAS_ prefixed records before/after

### [scripts/e2e-ui-workflows.mjs](../scripts/e2e-ui-workflows.mjs)
- **Purpose:** Browser-visible admin regression suite with Playwright
- **Coverage:**
  - Login/logout, theme toggle, and language persistence
  - Help page navigation and protected-route checks
  - Create, approve, reject, and non-destructive replacement from the browser UI
  - Imports from browser UI
  - Candidate `Batch history` interactions from the browser UI
  - Batch analytics detail with conflicts and deferred auto-promote evidence
  - Batch export download and content validation

### [scripts/test-scanner.mjs](../scripts/test-scanner.mjs)
- **Purpose:** Global validation gate for demos/releases
- **Process:**
  1. Server health check via `/api/health/db`
  2. Sequential execution: typecheck → e2e:nondestructive → e2e:client-asset → e2e:ui-workflows
  3. Stops on first failure
  4. Generates JSON report

### [data/demo/client-asset-pack/](../data/demo/client-asset-pack/)
- **Purpose:** Reusable test dataset for CLIENT entity
- **Contents:**
  - `mappings_valid.csv` - 2 valid rows (CAS_MAP_IMPORT_A/B)
  - `mappings_invalid.csv` - 3 rows with errors (duplicates, missing source)
  - `groups_valid.csv` - 2 valid rows (CAS_GRP_IMPORT_A/B)
  - `groups_invalid.csv` - 3 rows with errors
  - `parameters_valid.csv` - 2 valid rows (CAS_SCOPE_IMPORT_A/B)
  - `parameters_invalid.csv` - 3 rows with errors
  - `README.md` - Scenario matrix documentation

## Test Data Prefixes

Tests use isolated prefixes to avoid collisions:
- `CAS_` - Client Asset Suite (cleaned up after test)
- `YOLO_` - Development/manual testing (persistent)
- `IMPTEST_` - Import testing (persistent)
- `NDP_` - Non-destructive demo (deprecated, cleaned)

## CI/CD Integration

GitHub Actions workflow: [.github/workflows/test.yml](../.github/workflows/test.yml)

Runs on:
- Push to main
- Pull requests

Executes: `npm run test:scan`

Fails if overall status is not GO.

## Debugging Failed Tests

1. **Check server health:**
   ```bash
   curl http://localhost:3003/api/health/db
   ```

2. **Run individual test suite:**
   ```bash
   npm run e2e:nondestructive
   # or
   npm run e2e:client-asset
  # or
  npm run e2e:ui-workflows
   ```

3. **Inspect latest report:**
   ```bash
   cat reports/test-scan-latest.json
   ```

4. **Check database state:**
   ```bash
   npm run db:apply  # Resets schema to clean state
   npm run db:import-demo  # Loads initial demo data
   ```

## Adding New Tests

1. Create new test script in `scripts/e2e-*.mjs`
2. Add npm script to `package.json`
3. Update [test-scanner.mjs](../scripts/test-scanner.mjs) to include new script
4. Update package.json with step name if needed

Example:
```bash
# package.json
"e2e:mytest": "node scripts/e2e-mytest.mjs"
```

Then add to test-scanner.mjs in the `steps` array.

## Performance Baseline

Expected durations (on local machine):
- typecheck: ~2.6s
- e2e:nondestructive: ~9.8s
- e2e:client-asset: ~16.2s
- e2e:ui-workflows: ~3-4 min
- **Total:** ~4-5 min

Alert if total duration exceeds 6 min (indicates performance regression).

## See Also

- [docs/testing/README.md](../docs/testing/README.md) - Detailed testing guide
- [docs/prd-v2-operational-hardening.md](../docs/prd-v2-operational-hardening.md) - v2 sign-off
- [data/demo/client-asset-pack/README.md](../data/demo/client-asset-pack/README.md) - Asset pack scenarios
