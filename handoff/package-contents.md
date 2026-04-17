# Trial Package Contents

## Objective

Define the minimum package to send for a controlled trial without including local-only runtime artifacts.

## Include

Send these files and folders:

1. `src/`
2. `scripts/`
3. `db/`
4. `docs/`
5. `data/` if the demo scenario is part of the trial
6. `tests/` if the trial operator may need validation context
7. `package.json`
8. `package-lock.json`
9. `README.md`
10. `next.config.ts`
11. `tsconfig.json`
12. `eslint.config.mjs`
13. `.env.example`
14. `middleware.ts`
15. `next-env.d.ts`

## Do Not Include

Do not send these local artifacts:

1. `.env`
2. `node_modules/`
3. `.next/`
4. `coverage/`
5. local logs
6. `.tsbuildinfo`
7. `.git/`

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