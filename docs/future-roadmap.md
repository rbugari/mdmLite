# Future Roadmap

## Objective

Consolidate the future plan of MDM Lite into a single roadmap that starts from the real current state, keeps scope disciplined, and leaves a clean path for future integration with upstream analyzers.

## Planning Principle

MDM Lite should evolve as a governed operational rule product. It should not try to become a full analyzer of heterogeneous technical solutions.

If broader discovery is needed, that belongs upstream. MDM Lite remains the destination for review, approval, and controlled consumption.

## Roadmap Structure

### Track A - Governance Hardening

Goal:
turn the current demonstrable foundation into a controlled operational product.

### Track B - Better Inputs

Goal:
improve how rule candidates enter the system without overloading MDM with code intelligence.

### Track C - Consumption And Review

Goal:
make review, approval, and technical consumption robust and explainable.

## API Usage Principle

MDM Lite uses two different access patterns depending on the use case.

### Admin operations

The REST API (`/api/mappings`, `/api/groups`, `/api/parameters`, `/api/workflow`, etc.) is the correct channel for admin UI operations: create, edit, approve, reject, import. Volume is low and latency is acceptable. No change needed here.

### ETL and platform consumption

Row-by-row API calls for ETL lookups are the wrong pattern. When a pipeline transforms thousands of records, querying the API once per row creates unnecessary overhead and coupling. The correct model is:

1. For PostgreSQL-compatible platforms (Databricks via Lakebase, Fabric via Azure PostgreSQL): connect directly via JDBC or native connector to the active views. No API needed.
2. For platforms without a native PostgreSQL connector (Snowflake, others): use the snapshot export endpoint (see v0.3.1) to download the full active views as files and load them into a local table or stage. One call per pipeline run, not per row.

This principle should be preserved in all future consumption features.

## Release Direction

## v0.2 - Operational Hardening

### Status: closed

### Scope delivered

1. login for admin
2. approval workflow visible in UI
3. audit trail visible by record or entity
4. non-destructive update strategy for approved records
5. richer filters and pagination
6. import preview before confirmation

## v0.3 - Candidate Review Layer

### Status: closed

### Scope delivered

1. candidate storage
2. candidate list and detail review experience
3. evidence and confidence visibility
4. approve, reject, and promote actions
5. audited promotion into mappings, groups, or parameters

## v0.3.1 - Platform Consumption Connectors

### Status: closed

### Scope delivered

1. snapshot export endpoint: `GET /api/export/snapshot` returning JSON with embedded CSVs
2. individual view exports: `GET /api/export/mappings`, `/api/export/groups`, `/api/export/parameters`
3. authentication required on all export endpoints
4. platform connection guides in Help for Databricks (Lakebase + JDBC) and Fabric (Azure PostgreSQL + Dataflow Gen2)

## v0.4 - Document Discovery

### Status: closed

### Scope delivered

1. `src/lib/llm.ts` — OpenAI-compatible LLM client, `max_completion_tokens`, JSON object response format
2. `POST /api/candidates/extract` — text + documentName → LLM → stored candidates
3. `GET /api/candidates` — filterable list (status, type)
4. `GET /api/candidates/[id]` — single candidate detail
5. `POST /api/candidates/[id]/promote` — resolve entity type + rule set from payload → create DRAFT → status='promoted'
6. `POST /api/candidates/[id]/reject` — status='rejected'
7. `/candidates` UI page with two tabs: candidate list (filter + promote/reject) and extract-from-document form
8. `mdm_candidate` table + constraint fix in `mdm_change_log`

## v0.5 - External Candidate Input

### Status: closed

### Scope delivered

1. `INGEST_API_KEY` env variable (min 32 chars)
2. `src/lib/ingest-auth.ts` — Bearer token validation + `X-Source-System` header
3. `POST /api/candidates/batch` — up to 500 candidates/call, row-level error handling, audit log
4. Expanded `source_kind` constraint: `legacy2lake`, `sql`, `notebook`, `orchestration`

## v0.6 - Integration Exports + Dashboard

### Status: closed

### Scope delivered

1. `getDashboardStats()` extended with `pendingApprovals` + `pendingCandidates`
2. Home page stat strip shows 5 values (mappings, groups, parameters, pending approvals, pending candidates)
3. `GET /api/export/dbt` — dbt seeds YAML (`version: 2` + column types + embedded CSV)
4. `GET /api/export/openlineage` — OpenLineage 1-0-5 COMPLETE RunEvent with mdmRules custom facet
5. Integration guides in Help/Platforms for dbt seeds and OpenLineage (EN + ES)

## Cross-Cutting Requirements

### Candidate contract

Any candidate input must include:

1. `candidateType`
2. `payload`
3. `evidence`
4. `confidence`
5. `sourceKind`
6. `needsHumanReview`

### Review contract

1. detected is not approved
2. approved is not yet active unless promoted correctly
3. all promotion is audited
4. rejected candidates remain inspectable

### Technical contract preservation

Regardless of future inputs, downstream technical consumers keep reading from stable approved active views.

## Candidate Roadmap (v0.7+)

The following items are identified as next in value order:

### High value — candidate UX
1. **Bulk promote/reject** — checkbox multi-select + "Promote selected" / "Reject selected" in candidates UI
2. **Auto-promote threshold** — `INGEST_MIN_CONFIDENCE_AUTOPROMOTE` env var; candidates above threshold with `needsHumanReview=false` promote automatically on ingest
3. **Duplicate detection on ingest** — check if `(candidate_type, payload)` already exists with `status='pending'` before inserting

### Medium value — pipeline feedback
4. **Batch status endpoint** — `GET /api/candidates/batch/:batchId` — total/pending/promoted/rejected counts
5. **Promote conflict detection** — before creating draft, check if active rule with same key fields already exists; return 409 with warning

### Strategic value
6. **MCP server** — `.env` has `MCP_ENABLED=0`, `MCP_PORT=3103` reserved; exposes MDM rules to AI assistants via Model Context Protocol

## Not Planned For Near Term

1. full codebase analysis inside MDM Lite
2. replacing Purview, Unity Catalog, Collibra, or dbt
3. autonomous LLM write actions (all promotion is and will remain manual)
4. multi-company enterprise scope
5. enterprise-grade full MDM workflows (golden record, survivorship, stewardship domains)

## Strategic Link With Legacy2Lake And External Analyzers

1. Legacy2Lake or another analyzer extracts structured candidates
2. MDM Lite receives candidate packs via `POST /api/candidates/batch`
3. MDM Lite handles review, governance, approval, and promotion
4. MDM Lite publishes promoted rules as dbt seeds or OpenLineage facets for downstream consumption
4. downstream consumers keep reading stable active contracts

This preserves clean boundaries between analysis and governance.

## Immediate Next Steps

1. v0.3.1: snapshot export + platform guides (Databricks, Fabric)
2. v0.4: documentation discovery from markdown and business notes
3. v0.5: external candidate input from upstream analyzers

## Success Condition

MDM Lite should evolve into a lightweight but reliable governed destination for operational business rules, regardless of whether they enter manually, by file, from documentation, or from upstream analyzers.
