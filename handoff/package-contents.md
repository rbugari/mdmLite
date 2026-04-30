# Trial Package Contents

## Objective

Define the minimum package to send for a controlled trial without including local-only runtime artifacts.

## Include

Send these files and folders:

1. `src/`
2. `scripts/`
3. `db/`
4. `docs/windows-installation.md`
5. `docs/trial-install-access-and-db-guide.md`
6. `package.json`
7. `package-lock.json`
8. `README.md`
9. `next.config.ts`
10. `tsconfig.json`
11. `eslint.config.mjs`
12. `.env.example`
13. `middleware.ts`
14. `next-env.d.ts`
15. `LEER-PRIMERO-INSTALACION.md`
16. `LEER-DETALLADO-INSTALACION.md`

## Do Not Include

Do not send these local artifacts:

1. `.env`
2. `node_modules/`
3. `.next/`
4. `coverage/`
5. local logs
6. `.tsbuildinfo`
7. `.git/`
8. `tests/`
9. `reports/`
10. `handoff/`
11. `data/` unless the demo dataset is explicitly part of the trial

## Minimal Operator Instructions

The operator should only need this:

1. install Node.js 22 LTS
2. prepare PostgreSQL connection details
3. run `scripts\windows\install-and-start.bat`
4. run `scripts\windows\smoke-test.bat`
5. login at `http://127.0.0.1:3003` or the configured `APP_PORT`

## Validation Evidence To Include

Include these reports in the package or as separate evidence:

1. `reports/test-scan-latest.json`
2. `reports/e2e-ui-workflows-latest.json`
3. `reports/remote-foundation-validation-latest.json`
4. `reports/demo-reset-latest.json` if demo seed evidence is relevant

## Packaging Note

The current baseline is source delivery plus documented scripts. It is not yet an MSI, service installer, or bundled runtime package.

To assemble the package consistently, run:

```bat
scripts\windows\create-trial-package.bat
```

That produces the staging folder and the delivery ZIP under `dist\trial-package\`.

The generated package root also includes:

1. `LEER-PRIMERO-INSTALACION.md`
2. `LEER-DETALLADO-INSTALACION.md`