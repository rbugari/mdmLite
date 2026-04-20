# Current State And Contracts

## Objective

Describe the real current state of MDM Lite, aligned with what is implemented today, and define the technical and functional contracts that should be treated as canonical.

## Real Current State

MDM Lite currently provides a usable v2 MVP with:

1. authenticated admin access for operational pages
2. manual create and edit flows for mappings, groups, and parameters
3. approval queue with approve, reject, and inactivate actions
4. non-destructive replacement of approved records
5. audit trail screen and change log persistence
6. demo and file-based import flows with preview and confirmation
7. PostgreSQL-backed persistence
8. active SQL views for technical consumption
9. contextual Help for both administration and technical/platform consumption
10. DB health endpoint
11. bilingual UI copy and lightweight operational navigation

## What Is Implemented Today

### UI modules

1. home
2. mappings
3. groups
4. parameters
5. approvals
6. audit
7. auth/login
8. help
9. help/functional
10. help/positioning
11. help/platforms
12. help/executive
13. imports

### API surface

1. `POST /api/auth/login`
2. `POST /api/auth/logout`
3. `GET /api/auth/me`
4. `GET/POST /api/mappings`
5. `PUT /api/mappings/[id]`
6. `GET/POST /api/groups`
7. `PUT /api/groups/[id]`
8. `GET/POST /api/parameters`
9. `PUT /api/parameters/[id]`
10. `GET /api/workflow/pending`
11. `POST /api/workflow/transition`
12. `POST /api/imports/demo`
13. `POST /api/imports/upload/preview`
14. `POST /api/imports/upload/confirm`
15. `GET /api/health/db`
16. `GET /api/audit`

### Database foundation

The database already includes:

1. entity types
2. rule sets
3. mapping rules
4. group rules
5. parameters
6. users and roles
7. import batch and import item tables
8. change log table
9. active views for consumption

## Canonical Technical Contract

Downstream technical consumers should read only from these active views:

1. `vw_mdm_mapping_rule_active`
2. `vw_mdm_group_rule_active`
3. `vw_mdm_parameter_active`

The current contract assumption is:

1. only approved records are visible
2. only active records are visible
3. only currently valid records are visible

## Current Strengths

1. simple end-to-end demonstrable product
2. portable PostgreSQL model
3. lightweight admin UX
4. approval, audit, and non-destructive governance already operating
5. import path for both demo load and user-driven csv/xlsx load
6. stable read direction for technical consumers
7. contextual Help for business, admin, and platform audiences
8. clear product boundary and positioning

## Current Gaps

These define the next roadmap, not the validity of the current MVP.

### Governance gaps

1. authentication is still single-admin oriented, not enterprise IAM
2. authorization is admin-focused, not full multi-role RBAC
3. there is no delegated stewardship workflow by domain or team

### Product gaps

1. current writes are still optimized for a single-company reference domain model
2. there is no candidate inbox for semi-automated rule discovery
3. there is no public, supported write API for external applications
4. there is no multi-tenant or multi-company operating model

### Platform gaps

1. Databricks: resolved via Lakebase (PostgreSQL-compatible endpoint). Notebooks and jobs connect via JDBC directly to the active views. No packaged connector needed.
2. Microsoft Fabric: resolved when the instance runs on Azure Database for PostgreSQL. Fabric connects natively via the Dataflow Gen2 or Data Factory PostgreSQL connector and ingests active views directly into OneLake. If the instance runs on Neon or another external host, the same connector applies but requires network access configuration.
3. Snowflake: gap remains. No native PostgreSQL connector in Snowflake. Requires an external sync tool (Fivetran, Airbyte) or a periodic export feature not yet implemented in the product.
4. technical consumption is SQL-view based, not event-driven or CDC-driven

## Functional Contract For v2 MVP

For the current MVP, MDM Lite should be treated as:

1. admin-managed rule administration through UI
2. governed approval workflow with audit trail
3. import-driven and manual data entry
4. active SQL consumption for downstream technical processes
5. contextual product help for both administration and platform consumption

It should not yet be treated as:

1. enterprise IAM or enterprise RBAC product
2. authenticated public write API for third parties
3. autonomous rule extraction engine
4. multi-tenant or multi-company platform

## Data Entry Modes

Current entry modes are:

1. manual create/edit
2. demo workbook import
3. uploaded csv/xlsx import

## Technical Consumption Contract

The intended downstream usage is:

1. ETL, ELT, SQL, dbt, notebooks, or pipelines read from `vw_mdm_mapping_rule_active`
2. grouping logic reads from `vw_mdm_group_rule_active`
3. scoped parameters read from `vw_mdm_parameter_active`
4. downstreams should not couple directly to internal write tables unless they are doing administration or diagnostics

## Help Coverage

The current Help set covers both sides of the MVP:

1. administration and day-to-day operation from the Functional Guide
2. product positioning and scope from the Executive and Positioning sections
3. technical/platform consumption examples for SQL, Python, dbt, Databricks, Fabric, Snowflake, medallion, and ELT from the Platforms section

Future entry modes may include:

1. documentation discovery with candidate extraction
2. external candidate packs from analyzers

## Design Rule For Future Extensions

Any future smarter input should follow this pattern:

1. detect candidate
2. store candidate with evidence and confidence
3. review manually
4. approve or reject
5. promote to final rule tables

That rule applies especially if LLM-assisted extraction is introduced later.
