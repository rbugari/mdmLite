# MDM Lite v2

**Status:** ✅ Production Ready | **Version:** 2.0 | **Date:** 2026-04-15

Reference Data Manager (RDM) for centralized governance of business equivalences, groupings, and parameters with complete audit trail, approval workflow, and non-destructive change management.

## Current Technical Focus

Feature work is currently paused while the project is hardened for a first installable release. The active foundation target is:

- standard PostgreSQL without mandatory extensions
- remote customer-owned database support
- Windows-first installation path
- web application delivery, not desktop rewrite

## 🎯 Quick Start

```bash
# Setup
npm install
npm run db:apply           # Initialize PostgreSQL schema

# Development
npm run dev               # Start dev server (http://localhost:3003)

# Testing
npm run test:scan         # Full suite validation (GO/NO_GO)
npm run e2e:nondestructive  # Core workflow tests
npm run e2e:client-asset   # Comprehensive entity scenarios
npm run e2e:ui-workflows   # Browser-visible admin workflows

# Demo / training
npm run demo:reset        # Wipe operational data and seed a didactic scenario
```

**Expected:** Server ready in ~3s, full validation suite in ~4-5 min

System login is separate from the PostgreSQL connection. `DATABASE_URL` is only for the app to connect to the database. The web login uses `APP_ADMIN_USERNAME` and `APP_ADMIN_PASSWORD`, while `APP_ADMIN_EMAIL` is only the internal ADMIN user mapping inside `mdm_user`.

For a short, explainable product walkthrough, use `npm run demo:reset` and then follow [data/demo/didactic-scenario.md](data/demo/didactic-scenario.md).

## Windows-First Install

For the first installable path on Windows, use the batch scripts under `scripts/windows`:

```bat
scripts\windows\install-and-start.bat
scripts\windows\configure-production.bat
scripts\windows\install-production.bat
scripts\windows\start-production.bat
scripts\windows\smoke-test.bat
```

What each step does:

- `install-and-start.bat` is the simplest first-run entrypoint: it configures if needed, installs, builds, and starts the app.
- `configure-production.bat` creates or repairs `.env` interactively from a guided prompt.
- `install-production.bat` validates `.env`, installs dependencies, applies the PostgreSQL schema, creates a production build, and verifies `.next/standalone/server.js`.
- `start-production.bat` starts the already-built standalone server on `APP_PORT`.
- `smoke-test.bat` calls the homepage and `/api/health/db` to confirm the app is running and the database is reachable.

If you want the easiest first try, run only `scripts\windows\install-and-start.bat`.

That batch file is the official first-run entrypoint for the current Windows trial baseline.

`install-production.bat` now opens the configurator automatically when `.env` is missing or invalid, so the first-run flow is already “configure + install” without editing files by hand.

This is the current supported packaging baseline for customer-hosted trials on Windows. It is intentionally simple: Node.js + guided `.env` bootstrap + PostgreSQL + standalone production launcher.

## 📋 Project Status (v2)

| Phase | Component | Status |
|-------|-----------|--------|
| 1 | Authentication & Workflow | ✅ Complete |
| 2 | Non-Destructive Updates & Audit | ✅ Complete |
| 3 | Import Preview & List Operations | ✅ Complete |
| 4 | Future Contract Documentation | ✅ Complete |

**Sign-off Date:** 2026-04-15 | **Test Suite:** GO | **Last Run:** 275.0s

See [docs/prd-v2-operational-hardening.md](docs/prd-v2-operational-hardening.md) for detailed v2 specification and sign-off.

## 📁 Project Structure

```
MDM_Lite/
├── .github/workflows/
│   └── test.yml                          # CI/CD pipeline
├── docs/
│   ├── README.md                         # Documentation index
│   ├── prd-v2-operational-hardening.md  # v2 specification & sign-off
│   ├── product-definition.md            # Product requirements
│   ├── current-state-and-contracts.md   # API contracts
│   ├── future-roadmap.md                # v3+ roadmap
│   └── testing/
│       └── README.md                    # Comprehensive testing guide
├── data/
│   └── demo/
│       ├── client-asset-pack/           # Test datasets & scenarios
│       └── README.md
├── db/
│   ├── README.md
│   └── schema/
│       └── schema-mvp-mdmLite.sql       # PostgreSQL DDL
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/db/               # Server health endpoint
│   │   │   ├── imports/                 # Import preview/confirm
│   │   │   ├── workflow/                # State transitions
│   │   │   ├── groups/                  # Entity APIs
│   │   │   ├── mappings/
│   │   │   └── parameters/
│   │   ├── groups/                      # UI pages
│   │   ├── imports/
│   │   ├── mappings/
│   │   ├── parameters/
│   │   └── help/
│   ├── components/                       # React components
│   └── lib/
│       ├── db.ts                        # PostgreSQL client
│       ├── mdm.ts                       # Query layer
│       ├── imports.ts                   # Import logic
│       ├── app-config.ts
│       └── ...
├── scripts/
│   ├── e2e-nondestructive.mjs          # Core workflow tests
│   ├── e2e-client-asset-suite.mjs      # Comprehensive tests
│   ├── test-scanner.mjs                 # Test orchestrator
│   ├── apply-schema.mjs                 # DB setup
│   ├── import-demo.mjs                  # Demo data loader
│   └── run-next.mjs                     # Server launcher
├── tests/
│   ├── README.md                        # Test overview
│   └── e2e/                             # E2E test reference
├── package.json
├── tsconfig.json
├── next.config.ts
├── .env.example
└── reports/
    └── test-scan-latest.json           # Latest test report
```

## 🚀 Features

### Core Governance
- ✅ **Workflow states:** draft → pending_approval → approved/rejected/inactive
- ✅ **Approval required:** ADMIN role only
- ✅ **Non-destructive updates:** Old records auto-inactivated on approval
- ✅ **Audit trail:** Full history with actor, timestamp, and decision
- ✅ **Future-dated approvals:** Schedule changes without immediate effect

### Import Management
- ✅ **Preview before confirm:** Validate structure, detect errors/duplicates
- ✅ **One-time tokens:** Security gate against replay attacks
- ✅ **Per-target validation:** Mappings/Groups/Parameters specific rules
- ✅ **Error reporting:** Row-level issues with actionable feedback
- ✅ **Batch summary:** Insert/update/error counts upfront

### Operational UX
- ✅ **Pagination:** 5-100 rows per page, default 25
- ✅ **Entity filters:** Domain, scope type, rule sets
- ✅ **Direct history:** Click domain from table → filtered audit view
- ✅ **Pending queue:** One-click approval/rejection/inactivation
- ✅ **Search:** Find by code/name with partial match

### Technical Contracts
- ✅ **Active views:** Unchanged SQL contracts for downstream consumers
  - `vw_mdm_mapping_rule_active`
  - `vw_mdm_group_rule_active`
  - `vw_mdm_parameter_active`
- ✅ **Change log:** Audit table for compliance (change_log.entity, actor, action, timestamp)
- ✅ **Authentication:** `APP_ADMIN_USERNAME` + `APP_ADMIN_PASSWORD` for admin runtime access

## 🧪 Testing Infrastructure

**Four-layer validation stack:**

1. **Type Check** (~2.6s)
   ```bash
   npm run typecheck
   ```

2. **Non-Destructive E2E** (~9.8s)
   - Create → Approve → Update (triggers replacement) → Approve → Verify inactivation
   - Covers: Mappings, Groups, Parameters

3. **Client Asset Suite** (~16.2s)
   - 21 workflow scenarios (7 per entity)
   - 3 import scenarios (valid, token reuse, invalid)
   - Auto-cleanup (CAS_ prefixed records)

4. **Browser UI Workflows** (~3.5m)
   - Login/logout and protected route behavior
   - Theme/language switching
   - Manual create/edit/approve flows via browser
   - Help navigation and import console

**Global Validator:**
```bash
npm run test:scan
# Output: GO/NO_GO + JSON report (reports/test-scan-latest.json)
# Expected: ~4-5 min, all steps pass
```

### Test Data

**Prefixes for isolation:**
- `CAS_` = Client Asset Suite (cleaned after test)
- `YOLO_` = Manual/dev testing (persistent)
- `IMPTEST_` = Import validation (persistent)

**Asset Pack:** [data/demo/client-asset-pack/](data/demo/client-asset-pack/)
- 6 CSV files (valid/invalid per entity)
- Scenarios matrix in README.md

For detailed testing guide, see [docs/testing/README.md](docs/testing/README.md)

## 🔧 Development

### Environment Setup

Create `.env`:
```
DATABASE_URL=postgresql://user:pass@localhost/mdm_lite
DATABASE_SSL_MODE=disable
APP_ADMIN_USERNAME=admin
APP_ADMIN_EMAIL=admin@example.com
APP_ADMIN_PASSWORD=change-this-password
APP_AUTH_SECRET=change-this-secret-now
```

`DATABASE_SSL_MODE` supports `disable`, `require`, and `no-verify`. Use `require` for managed PostgreSQL with valid certificates, `disable` for local trusted setups, and `no-verify` only for temporary compatibility tests.

For managed PostgreSQL endpoints, prefer `?sslmode=verify-full` in `DATABASE_URL` so the connection-string behavior stays aligned with the current secure default in `pg` and upcoming driver changes.

If the production smoke test reports `self-signed certificate in certificate chain`, the current database endpoint is not presenting a certificate chain that Node.js can validate under `require`. In that case, fix the certificate path or use `no-verify` only as a temporary controlled fallback.

### Common Commands

```bash
# Database
npm run db:apply          # Initialize schema
npm run db:import-demo    # Load demo data

# Runtime validation
npm run env:check         # Validate required runtime env vars
npm run smoke:prod        # Smoke test against a running app

# Development
npm run dev              # Start server + watch
npm run build            # Production build
npm run start            # Run production build
npm run lint             # ESLint check

# Testing
npm run typecheck                 # TypeScript validation
npm run e2e:nondestructive       # Core workflows
npm run e2e:client-asset         # Comprehensive tests
npm run e2e:ui-workflows         # Browser-visible workflows
npm run test:scan                # Full suite + report
```

### Git Workflow

```bash
git add .
git commit -m "message"
git push origin main
```

CI/CD runs automatically on push (see `.github/workflows/test.yml`).

## 📊 API Reference

### Health Check
```bash
GET /api/health/db
# { ok: true, timestamp }
```

### Import Preview
```bash
POST /api/imports/upload/preview
# Body: { target: "mappings|groups|parameters", file: File }
# Response: { token, summary: { totalRows, validRows, errors, issues[] } }
```

### Import Confirm
```bash
POST /api/imports/upload/confirm
# Body: { token }
# Response: { imported, summary }
```

### Workflow Transition
```bash
POST /api/workflow/transition
# Body: { entity, id, action: "approve|reject|inactivate", comments }
# Response: { status, record }
```

For complete API contracts, see [docs/current-state-and-contracts.md](docs/current-state-and-contracts.md)

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [docs/README.md](docs/README.md) | Documentation index |
| [docs/prd-v2-operational-hardening.md](docs/prd-v2-operational-hardening.md) | v2 spec + sign-off |
| [docs/product-definition.md](docs/product-definition.md) | Product requirements |
| [docs/current-state-and-contracts.md](docs/current-state-and-contracts.md) | API/DB contracts |
| [docs/future-roadmap.md](docs/future-roadmap.md) | v3+ roadmap |
| [docs/testing/README.md](docs/testing/README.md) | Testing guide |
| [data/demo/client-asset-pack/README.md](data/demo/client-asset-pack/README.md) | Test scenarios |

## 🚦 Pre-Demo Checklist

Before demo or release:

```bash
# 1. Fresh schema
npm run db:apply

# 2. Start server
npm run dev

# 3. Run validation (in another terminal)
npm run test:scan

# 4. Verify report
cat reports/test-scan-latest.json
# Expected: "overall": "GO"

# 5. Ready! ✅
```

## 🔄 CI/CD

GitHub Actions workflow: [.github/workflows/test.yml](.github/workflows/test.yml)

**Triggers:**
- Push to main/develop
- Pull requests to main/develop

**Steps:**
1. Checkout code
2. Setup Node + PostgreSQL
3. Apply schema
4. Start server
5. Run `npm run test:scan`
6. Upload report artifact

**Failure:** Pipeline stops if test:scan returns NO_GO

## 📞 Support & Contact

**Questions about:**
- **Product:** See [docs/product-definition.md](docs/product-definition.md)
- **Testing:** See [docs/testing/README.md](docs/testing/README.md)
- **Architecture:** See [docs/current-state-and-contracts.md](docs/current-state-and-contracts.md)
- **Roadmap:** See [docs/future-roadmap.md](docs/future-roadmap.md)

## 📝 License

Internal project for Ventas-Perseida reference data governance.
2. Existe un healthcheck de DB en `/api/health/db`.
3. El pool PostgreSQL se comparte entre requests para evitar crear conexiones repetidas en desarrollo.
4. Existe un endpoint funcional inicial en `/api/mappings`.
5. El esquema puede aplicarse con `npm run db:apply`.
6. La demo inicial puede cargarse con `npm run db:import-demo`.

## Carga inicial de demo
1. Aplicar esquema: `npm run db:apply`
2. Importar Excel demo: `npm run db:import-demo`
3. Verificar endpoints:
	1. `/api/health/db`
	2. `/api/mappings`
	3. `/api/parameters`

## Puertos locales
Todos los servicios locales deben usar puertos terminados en `3`.

Configuracion actual prevista:
1. App web: `3003`
2. MCP futuro: `3103`
3. Worker futuro: `3203`

## Ejecucion local
1. Configurar variables en `.env`.
2. Ejecutar `scripts\start-all.bat`.
3. El launcher valida puertos ocupados y abre cada servicio habilitado en una ventana CMD independiente.

## Base de datos
La base PostgreSQL actual es remota en Supabase, por lo que no se levanta una instancia local desde el launcher.

## Nota
Existe una copia bloqueada temporalmente del archivo `input_mvp_ventas_perseida_v2.xlsx` en la raiz porque otro proceso la mantiene abierta. El dataset correcto ya fue copiado a `data/demo/`.
