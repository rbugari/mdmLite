# Testing Guide - MDM Lite v2

Complete reference for running, debugging, and extending tests in MDM Lite.

## Quick Start

```bash
# Ensure server is running
npm run dev

# Run all tests
npm run test:scan

# Result: GO/NO_GO in ~4-5 min
# Report: reports/test-scan-latest.json
```

## Test Organization

### scripts/ - Test Implementation
All executable test scripts:
- `scripts/e2e-nondestructive.mjs` - Core workflow validation
- `scripts/e2e-client-asset-suite.mjs` - Comprehensive entity scenarios
- `scripts/e2e-ui-workflows.mjs` - Browser-based admin and consumption workflow validation
- `scripts/test-scanner.mjs` - Test orchestrator and reporter
- `scripts/run-next.mjs` - Server launcher
- `scripts/apply-schema.mjs` - Database schema setup
- `scripts/import-demo.mjs` - Demo data seeding

### data/demo/ - Test Data
Reusable datasets:
- `data/demo/client-asset-pack/` - CLIENT entity scenarios (6 CSV files)
- `data/demo/input_mvp_ventas_perseida_v2.xlsx` - Original demo data

### tests/ - Test Documentation
- `tests/README.md` - Test overview and commands
- `tests/e2e/` - E2E test directory (reference only)

### docs/testing/ - Testing Documentation
- `docs/testing/README.md` - This file
- Guides and patterns for test development

## Test Suites Explained

### 1. TypeScript Type Checking
**Command:** `npm run typecheck`

**What it does:**
- Validates TypeScript compilation
- Checks for type errors across codebase
- No runtime execution

**Coverage:**
- src/ - application code
- scripts/ - build and test scripts
- tsconfig.json - compilation config

**Expected output:**
```
✓ 0 errors
Duration: 2-3 seconds
```

**Failure modes:**
- Syntax errors
- Type mismatches
- Missing imports

**Debugging:**
```bash
npm run typecheck 2>&1 | head -20  # Show first 20 lines of errors
```

### 2. E2E Non-Destructive Workflow
**Command:** `npm run e2e:nondestructive`

**What it does:**
- Tests core create → approve → replace → approve workflow
- Validates non-destructive update behavior
- Checks auto-inactivation of replaced records

**Test sequence:**
```
1. CREATE mapping + APPROVE
   └─ Verify: status = approved, visible in active view
2. UPDATE approved mapping
   └─ Verify: mode = non_destructive_replacement, new record pending
3. APPROVE replacement
   └─ Verify: new visible, old auto-inactivated
4. Repeat for groups and parameters
```

**Test data:**
- Prefixed with YOLO_ (not cleaned, persistent)
- 3 workflows (1 per entity)
- Total operations: 9

**Expected output:**
```
base_url=http://localhost:3003
mapping_flow=ok
group_flow=ok
parameter_flow=ok
E2E_NON_DESTRUCTIVE_OK
```

**Failure modes:**
- Server not running
- Database schema missing
- Permission issues (non-ADMIN user)
- Non-destructive logic broken

**Debugging:**
```bash
# Run with server running in another terminal
npm run e2e:nondestructive

# Check database state if failed:
psql -d mdm_lite -c "SELECT * FROM mdm_mapping_rule WHERE code LIKE 'YOLO_%';"
psql -d mdm_lite -c "SELECT * FROM mdm_change_log WHERE entity = 'mapping' ORDER BY created_at DESC LIMIT 5;"
```

### 3. E2E Client Asset Suite
**Command:** `npm run e2e:client-asset`

**What it does:**
- Tests all CLIENT entity use cases
- Validates import preview/confirm workflow
- Tests import validation (valid/invalid/token reuse)
- Auto-cleanup of test data

**Test workflows (21 total):**
```
Mappings:
  ✓ Create + Approve → Visible
  ✓ Replace approved → Approve replacement → Auto-inactivate
  ✓ Reject pending → Rejected status
  ✓ Inactivate approved → Hidden
  ✓ Future-dated approval

Groups:
  ✓ Create + Approve → Visible
  ✓ Replace approved → Approve replacement → Auto-inactivate
  ✓ Reject pending → Rejected status
  ✓ Inactivate approved → Hidden
  ✓ Future-dated approval

Parameters:
  ✓ Create + Approve → Visible
  ✓ Replace approved → Approve replacement → Auto-inactivate
  ✓ Reject pending → Rejected status
  ✓ Inactivate approved → Hidden
  ✓ Future-dated approval

Imports:
  ✓ Valid CSV → Preview (token) → Confirm → Imported
  ✓ Token reuse fails (one-time use)
  ✓ Invalid CSV → Errors shown
```

**Test data:**
- All prefixed with CAS_ (auto-cleaned at start/end)
- Uses data/demo/client-asset-pack/ CSV files
- 6 scenarios (valid/invalid per entity)

**Expected output:**
```
workflow_suite=ok
import_suite=ok
E2E_CLIENT_ASSET_SUITE_OK
```

**Failure modes:**
- Validation logic broken
- Import endpoint errors
- Token generation/consumption broken
- Database cleanup failed

**Debugging:**
```bash
# Run with output
npm run e2e:client-asset

# If cleanup failed, manually clean test data:
psql -d mdm_lite -c "DELETE FROM mdm_mapping_rule WHERE code LIKE 'CAS_%';"
psql -d mdm_lite -c "DELETE FROM mdm_group_rule WHERE code LIKE 'CAS_%';"
psql -d mdm_lite -c "DELETE FROM mdm_parameter WHERE code LIKE 'CAS_%';"
```

### 4. Browser UI Workflow Suite
**Command:** `npm run e2e:ui-workflows`

**What it does:**
- Validates user-visible browser flows against the live app
- Covers login/logout, theme/language, help navigation, CRUD via UI, approvals, imports, audit, and protected-route behavior
- Uses Playwright with Chromium and isolated UI-prefixed test records

**Coverage:**
- login, logout, and protected-route enforcement
- mappings/groups/parameters create and approval flows
- mapping non-destructive replacement via UI
- import demo plus csv preview/confirm
- help content for admin and platform usage

**Expected output:**
```bash
ui_step_start=server-health
...
ui_step_ok=logout-and-protected-route
```

**Report output:**
- `reports/e2e-ui-workflows-latest.json`

### 5. Global Test Scanner
**Command:** `npm run test:scan`

**What it does:**
- Orchestrates all four test suites
- Validates server health first
- Stops on first failure
- Generates JSON report

**Execution order:**
```
1. Server health check
   └─ GET /api/health/db
2. Typecheck (2-3s)
   └─ npm run typecheck
3. E2E Non-Destructive (9-10s)
   └─ npm run e2e:nondestructive
4. E2E Client Asset (20-25s)
   └─ npm run e2e:client-asset
5. E2E UI Workflows (3-4 min)
  └─ npm run e2e:ui-workflows
```

**Report output:**
```json
{
  "generatedAt": "2026-04-15T06:44:30.590Z",
  "overall": "GO",
  "baseUrl": "http://localhost:3003",
  "server": {
    "ok": true,
    "error": null
  },
  "totalDurationMs": 275000,
  "steps": [
    {
      "script": "typecheck",
      "code": 0,
      "ok": true,
      "durationMs": 2632
    },
    {
      "script": "e2e:nondestructive",
      "code": 0,
      "ok": true,
      "durationMs": 9835
    },
    {
      "script": "e2e:client-asset",
      "code": 0,
      "ok": true,
      "durationMs": 16192
    },
    {
      "script": "e2e:ui-workflows",
      "code": 0,
      "ok": true,
      "durationMs": 211602
    }
  ]
}
```

**Exit codes:**
- 0 = GO (all steps passed)
- 1 = NO_GO (server unavailable or any step failed)

**Debugging:**
```bash
# Check report
cat reports/test-scan-latest.json

# Identify failing step and run individually
npm run e2e:nondestructive  # Run failing suite directly
```

## Pre-Demo/Release Checklist

Before demo or release to production:

```bash
# 1. Ensure clean schema
npm run db:apply

# 2. Seed demo data (optional)
npm run db:import-demo

# 3. Start server
npm run dev

# 4. In another terminal, run full scan
npm run test:scan

# 5. Check report
cat reports/test-scan-latest.json

# 6. Verify: overall = "GO"
```

If all pass → **READY FOR DEMO/RELEASE**

## Environment Variables

`.env` must contain:
```
DATABASE_URL=postgresql://user:password@localhost/mdm_lite
APP_ADMIN_EMAIL=admin@example.com
APP_ADMIN_PASSWORD=your-password
```

Tests use these for:
- Database connectivity
- Admin context resolution
- Server health checks

## Adding New Tests

### Step 1: Create Test Script
File: `scripts/e2e-myentity.mjs`

Template:
```javascript
import fs from "node:fs";

function loadEnv(path) {
  const txt = fs.readFileSync(path, "utf8");
  const env = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const baseUrl = "http://localhost:3003";

async function main() {
  try {
    // Your tests here
    console.log("myentity_flow=ok");
    process.exit(0);
  } catch (err) {
    console.error("E2E_MYENTITY_ERROR:", err.message);
    process.exit(1);
  }
}

main();
```

### Step 2: Add npm Script
File: `package.json`

```json
{
  "scripts": {
    "e2e:myentity": "node scripts/e2e-myentity.mjs"
  }
}
```

### Step 3: Add to Scanner
File: `scripts/test-scanner.mjs`

Find the `steps` array and add:
```javascript
  {
    script: "e2e:myentity",
    name: "E2E MyEntity Tests"
  }
```

### Step 4: Test
```bash
npm run e2e:myentity   # Test individually
npm run test:scan      # Run in full suite
```

## Troubleshooting

### Server Not Running
```
Error: fetch failed
```

**Solution:**
```bash
npm run dev  # In another terminal
```

### Database Schema Missing
```
Error: relation "mdm_mapping_rule" does not exist
```

**Solution:**
```bash
npm run db:apply
```

### Permission Denied (Non-ADMIN)
```
Error: Unauthorized: admin_only_action
```

**Solution:**
Tests use ADMIN role by default. Check `.env` for `APP_ADMIN_EMAIL` and `APP_ADMIN_PASSWORD`.

### Test Data Left Behind
```
CAS_ or YOLO_ records still in database
```

**Solution:**
```bash
# Manual cleanup
psql -d mdm_lite -c "DELETE FROM mdm_mapping_rule WHERE code LIKE 'CAS_%' OR code LIKE 'YOLO_%';"
psql -d mdm_lite -c "DELETE FROM mdm_group_rule WHERE code LIKE 'CAS_%' OR code LIKE 'YOLO_%';"
psql -d mdm_lite -c "DELETE FROM mdm_parameter WHERE code LIKE 'CAS_%' OR code LIKE 'YOLO_%';"
```

### Flaky Tests (Intermittent Failures)
**Common causes:**
- Server slowness
- Database locks
- Port conflicts

**Debug:**
```bash
# Run with increased timeout
npm run e2e:client-asset

# Check server logs in dev terminal for errors
# Ctrl+C to stop, npm run dev again to restart clean
```

## Performance Tuning

If tests exceed 45s total:

1. **Profile individual suites:**
   ```bash
   time npm run typecheck
   time npm run e2e:nondestructive
   time npm run e2e:client-asset
   ```

2. **Identify bottleneck:**
   - typecheck > 5s → TypeScript issue
   - e2e > 20s → Database or server issue

3. **Optimize:**
   - Clear `.next/` cache: `rm -r .next/`
   - Restart server: `npm run dev`
   - Reset database: `npm run db:apply`

## Integration with CI/CD

See [.github/workflows/test.yml](../../.github/workflows/test.yml)

Runs on:
- Push to `main`
- Pull requests

Fails if `npm run test:scan` exits with code 1.

## See Also

- [tests/README.md](../README.md) - Quick test reference
- [data/demo/client-asset-pack/README.md](../../data/demo/client-asset-pack/README.md) - Asset pack scenarios
- [docs/prd-v2-operational-hardening.md](../prd-v2-operational-hardening.md) - v2 requirements
- [docs/current-state-and-contracts.md](../current-state-and-contracts.md) - API contracts
