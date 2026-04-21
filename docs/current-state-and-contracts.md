# Current State And Contracts

## Objective

Describe the real current state of MDM Lite, aligned with what is implemented today, and define the technical and functional contracts that should be treated as canonical.

## Real Current State

MDM Lite is at **v0.6** with a complete operational product that provides:

1. authenticated admin access for all operational pages
2. manual create and edit flows for mappings, groups, and parameters
3. approval queue with approve, reject, and inactivate actions
4. non-destructive replacement of approved records
5. audit trail screen and change log persistence
6. demo and file-based import flows with preview and confirmation
7. PostgreSQL-backed persistence
8. active SQL views for technical consumption
9. LLM-assisted candidate extraction from text/documents (v0.4)
10. external batch ingest API with API key authentication (v0.5)
11. candidate review UI with promote/reject actions
12. integration exports: dbt seeds YAML, OpenLineage RunEvent, CSV, snapshot (v0.3.1 + v0.6)
13. dashboard stats: active rules + pending approvals + pending candidates (v0.6)
14. contextual Help for administration, positioning, platform consumption, and integration guides
15. bilingual UI (English + Spanish)
16. DB health endpoint

## What Is Implemented Today

### UI modules

1. home (with 5-stat dashboard strip)
2. mappings
3. groups
4. parameters
5. approvals
6. audit
7. auth/login
8. help
9. help/functional
10. help/positioning
11. help/platforms (includes dbt + OpenLineage integration guides)
12. help/executive
13. imports
14. candidates (list + extract from document tabs)

### API surface

#### Auth
1. `POST /api/auth/login`
2. `POST /api/auth/logout`
3. `GET /api/auth/me`

#### Entities
4. `GET/POST /api/mappings`
5. `PUT /api/mappings/[id]`
6. `GET/POST /api/groups`
7. `PUT /api/groups/[id]`
8. `GET/POST /api/parameters`
9. `PUT /api/parameters/[id]`

#### Workflow
10. `GET /api/workflow/pending`
11. `POST /api/workflow/transition`

#### Imports
12. `POST /api/imports/demo`
13. `POST /api/imports/upload/preview`
14. `POST /api/imports/upload/confirm`

#### Health
15. `GET /api/health/db`

#### Audit
16. `GET /api/audit`

#### Candidates (v0.4 + v0.5)
17. `POST /api/candidates/extract` — `{ text, documentName }` → LLM → stored candidates → `{ ok, extracted, batchId }`
18. `GET /api/candidates` — `?status=pending|promoted|rejected|all&type=mapping|group|parameter|unknown&limit=N`
19. `GET /api/candidates/[id]`
20. `POST /api/candidates/[id]/promote` — `{ comments? }` → creates DRAFT in target table → status='promoted'
21. `POST /api/candidates/[id]/reject` — `{ comments? }` → status='rejected'
22. `POST /api/candidates/batch` — Bearer `<INGEST_API_KEY>` + optional `X-Source-System` header. Body: `{ sourceKind, sourceName, candidates[] }`. Up to 500/call. Row-level error handling.

#### Exports (v0.3.1 + v0.6)
23. `GET /api/export/mappings` — CSV file download
24. `GET /api/export/groups` — CSV file download
25. `GET /api/export/parameters` — CSV file download
26. `GET /api/export/snapshot` — JSON envelope with all 3 CSVs embedded + counts
27. `GET /api/export/dbt` — dbt seeds YAML (`version: 2` + column types + descriptions + embedded CSV blocks)
28. `GET /api/export/openlineage` — OpenLineage spec 1-0-5 COMPLETE RunEvent with mdmRules custom facet and SchemaDatasetFacets

### Database foundation

The database includes:

1. entity types
2. rule sets
3. mapping rules (with `mdm_mapping_rule` + `vw_mdm_mapping_rule_active`)
4. group rules (with `mdm_group_rule` + `vw_mdm_group_rule_active`)
5. parameters (with `mdm_parameter` + `vw_mdm_parameter_active`)
6. users and roles
7. import batch and import item tables
8. change log table (`mdm_change_log`) with extended `action_type` (create, update, approve, reject, inactivate, import, export, extract, promote)
9. candidate table (`mdm_candidate`) with `source_kind`, `candidate_type`, `payload`, `evidence`, `confidence`, `status`, `extraction_batch_id`
10. active views for consumption

### Key library modules

| File | Purpose |
|------|---------|
| `src/lib/db.ts` | PostgreSQL pool client |
| `src/lib/mdm.ts` | Query layer + `getDashboardStats()` |
| `src/lib/llm.ts` | LLM client (OpenAI-compatible, `max_completion_tokens`) |
| `src/lib/ingest-auth.ts` | Bearer API key validation for batch endpoint |
| `src/lib/env.ts` | Zod env validation including LLM + ingest vars |
| `src/lib/ids.ts` | `createId()` — CUID2 ID generator |
| `src/lib/copy.ts` | Bilingual UI strings (EN + ES) |

## Canonical Technical Contract

Downstream technical consumers should read only from these active views:

1. `vw_mdm_mapping_rule_active`
2. `vw_mdm_group_rule_active`
3. `vw_mdm_parameter_active`

The current contract assumption is:

1. only approved records are visible
2. only active records are visible
3. only currently valid records are visible

## Integration Export Contracts

### dbt seeds (`GET /api/export/dbt`)

Returns `text/yaml`. Structure:
```yaml
version: 2
seeds:
  - name: mdm_mappings      # → seeds/mdm_mappings.csv
  - name: mdm_groups         # → seeds/mdm_groups.csv
  - name: mdm_parameters     # → seeds/mdm_parameters.csv
```
Each seed has `column_types` and `columns` with descriptions. The actual CSV data is embedded as commented lines for copy-paste. All three CSVs reflect active views at export time.

### OpenLineage (`GET /api/export/openlineage`)

Returns `application/json`. Spec: OpenLineage 1-0-5.
```json
{
  "eventType": "COMPLETE",
  "run": { "runId": "<cuid2>", "facets": { "mdmRules": { ... counts ... } } },
  "job": { "namespace": "mdm-lite", "name": "mdm-rules-snapshot" },
  "outputs": [ mdm_mappings, mdm_groups, mdm_parameters with SchemaDatasetFacet ]
}
```
`runId` is unique per call and logged in `mdm_change_log`. Consumable by Microsoft Purview (OpenLineage REST sink), Marquez (`POST /api/v1/lineage`), and OpenMetadata.

## Candidate Contract

Any candidate stored in `mdm_candidate` must include:

| Field | Required | Description |
|-------|----------|-------------|
| `candidate_type` | yes | `mapping`, `group`, `parameter`, `unknown` |
| `payload` | yes | JSONB — type-specific fields |
| `evidence` | yes | Text snippet justifying the candidate |
| `confidence` | yes | Float 0–1 |
| `source_kind` | yes | `document`, `external`, `manual`, `legacy2lake`, `sql`, `notebook`, `orchestration` |
| `needs_human_review` | yes | Always true for LLM extraction |
| `status` | yes | `pending`, `promoted`, `rejected` |

## Current Strengths

1. complete end-to-end demonstrable product
2. portable PostgreSQL model (Neon, Supabase, Azure PostgreSQL, local)
3. lightweight admin UX with bilingual support
4. approval, audit, and non-destructive governance operating
5. import path for demo and user-driven csv/xlsx
6. stable read contract for technical consumers
7. LLM candidate extraction pipeline with human review gate
8. external batch ingest for pipeline-driven candidates
9. integration exports compatible with dbt, Purview, Marquez, OpenMetadata
10. contextual Help for business, admin, platform, and integration audiences
11. clear product boundary — does not compete with Purview / Unity Catalog / Collibra

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

These define the next roadmap, not the validity of the current product.

### Governance gaps

1. authentication is single-admin oriented, not enterprise IAM
2. authorization is admin-focused, not full multi-role RBAC
3. no delegated stewardship workflow by domain or team

### Product gaps

1. no bulk promote/reject UI for candidates (must be done one at a time)
2. no auto-promote threshold (candidates with high confidence still require manual review)
3. no conflict detection on promote (no check for duplicate active rules before creating draft)
4. no deduplication on candidate ingest (same payload can arrive as multiple pending candidates)
5. no batch status endpoint (`GET /api/candidates/batch/:batchId`)

### Platform gaps

1. Databricks: resolved via Lakebase (JDBC direct to active views)
2. Microsoft Fabric: resolved via Azure PostgreSQL native connector
3. Snowflake: use snapshot or dbt export — no native PostgreSQL connector
4. technical consumption is SQL-view based, not event-driven or CDC-driven

## Functional Contract For Current Product

For the current product (v0.6), MDM Lite should be treated as:

1. admin-managed rule administration through UI
2. governed approval workflow with audit trail
3. import-driven and manual data entry
4. LLM-assisted candidate discovery (document paste/upload → review → promote)
5. external candidate ingest from pipelines (API key protected)
6. active SQL consumption for downstream technical processes
7. integration export to dbt and OpenLineage-compatible catalogues
8. contextual product help for administration, platform, and integration consumption

It should not yet be treated as:

1. enterprise IAM or enterprise RBAC product
2. autonomous rule publishing engine (all promotion is manual)
3. multi-tenant or multi-company platform
4. replacement for Purview, Unity Catalog, Collibra, or dbt

## Data Entry Modes

Current entry modes are:

1. manual create/edit via UI
2. demo workbook import
3. uploaded csv/xlsx import
4. LLM document extraction → candidate → manual promote
5. external batch ingest via API key → candidate → manual promote

## Technical Consumption Contract

The intended downstream usage is:

1. ETL, ELT, SQL, dbt, notebooks, or pipelines read from `vw_mdm_mapping_rule_active`
2. grouping logic reads from `vw_mdm_group_rule_active`
3. scoped parameters read from `vw_mdm_parameter_active`
4. downstreams should not couple directly to internal write tables
5. for dbt projects: use `GET /api/export/dbt` to download seeds YAML, then `dbt seed`
6. for data catalogues (Purview, Marquez, OpenMetadata): use `GET /api/export/openlineage` to emit a RunEvent

## Help Coverage

The current Help set covers both sides of the product:

1. administration and day-to-day operation from the Functional Guide
2. product positioning and scope from the Executive and Positioning sections
3. technical/platform consumption examples for SQL, Python, dbt, Databricks, Fabric, Snowflake, medallion, and ELT from the Platforms section
4. dbt seeds export and OpenLineage integration guides in the Platforms section

## Design Rule For Future Extensions

Any future smarter input should follow this pattern:

1. detect candidate
2. store candidate with evidence and confidence
3. review manually
4. approve or reject
5. promote to final rule tables

That rule applies regardless of how the candidate was generated (LLM, pipeline, analyzer, or manual).
