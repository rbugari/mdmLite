# Technical Foundation Plan

## Objective

Pause new product features and harden the project for a first installable release with these boundaries:

1. web application stays as the delivery model
2. PostgreSQL is the only supported database engine
3. PostgreSQL setup must not require mandatory extensions
4. first installation target is Windows
5. customer-owned remote PostgreSQL is a first-class deployment scenario

## Current Phase

The repository is in foundation mode. Product work is intentionally secondary until the following technical milestones are complete.

## Milestone 1 - Standard PostgreSQL Baseline

Status: in progress

Goals:

1. remove mandatory `pgcrypto` dependency from the base schema
2. generate record IDs in the application and setup scripts
3. keep the schema compatible with standard PostgreSQL features already used by the app

Completed in this phase:

1. schema no longer requires `CREATE EXTENSION pgcrypto`
2. write paths now provide explicit UUID values
3. base seed rows use explicit stable IDs

Remaining checks:

1. validate schema bootstrap on a fresh standard PostgreSQL instance
2. verify demo and import scripts against a clean database

## Milestone 2 - Remote Database Connectivity

Status: in progress

Goals:

1. support local trusted PostgreSQL and managed remote PostgreSQL with explicit SSL settings
2. remove the hardcoded insecure SSL behavior from runtime and scripts
3. keep health diagnostics simple for installation testing

Completed in this phase:

1. `DATABASE_SSL_MODE` introduced for app runtime and setup scripts
2. supported modes are `disable`, `require`, and `no-verify`

Remaining checks:

1. validate against at least one managed PostgreSQL service with certificate validation enabled
2. decide whether certificate-path support is needed in the next iteration

## Milestone 3 - Windows-First Packaging

Status: planned

Goals:

1. separate distribution scripts from developer scripts
2. provide a Windows-first installation flow without requiring repository knowledge
3. keep the first release simple before evaluating Docker or MSI packaging

Scope:

1. release folder or packaged app output
2. `.env` template and validation
3. setup script for schema apply
4. start script for production runtime
5. smoke test using `/api/health/db`

## Milestone 4 - Operational Baseline

Status: planned

Goals:

1. document install prerequisites and upgrade expectations
2. define minimal logging and support diagnostics
3. clarify the free-edition support boundary

## Backlog Order

Execute in this order:

1. fresh database validation for the new schema baseline
2. package and startup design for Windows-first release
3. installation scripts and release notes
4. operational guide and smoke-test checklist
5. only after that, reassess product feature backlog