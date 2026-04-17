# Trial Known Limitations

## Accepted Limitations For The First Trial

These limitations are acceptable for the controlled first trial and do not block the release baseline by themselves:

1. no one-click installer
2. no Windows service wrapper
3. no bundled Node.js runtime
4. no automatic upgrade and rollback flow
5. no enterprise IAM integration
6. no broader RBAC model beyond the current admin-oriented flow

## Operational Constraints

The current trial baseline assumes:

1. Windows-first installation
2. customer-hosted web runtime
3. customer-owned PostgreSQL
4. guided `.env` setup
5. documented batch-script startup and smoke validation

## Not Accepted As A Release Blocker Workaround

These should not be reclassified as acceptable limitations while closing the baseline:

1. broken production build
2. broken DB health path
3. broken official install path
4. broken login flow in the supported trial path
5. broken consolidated validation evidence

## Current Non-Accepted Blockers

As of 2026-04-17, there are no remaining non-accepted blockers for the first controlled trial baseline.

## Exit Condition

This register is considered stable when:

1. all accepted limitations are explicit
2. no hidden operational gaps remain
3. the remaining non-accepted blockers are closed or explicitly escalated