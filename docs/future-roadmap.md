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

### Status: next

### Objective

Enable native and performant consumption from modern data platforms without requiring row-by-row API calls.

### Scope

1. snapshot export endpoint: `GET /api/export/snapshot` returning a ZIP with one CSV per active view
2. individual view exports: `GET /api/export/mappings.csv`, `GET /api/export/groups.csv`, `GET /api/export/parameters.csv`
3. authentication required on all export endpoints (same session or token)
4. platform connection guides in Help for Databricks (Lakebase + JDBC) and Fabric (Azure PostgreSQL + Dataflow Gen2)

### What this solves

Databricks and Fabric can consume rules natively via SQL without any export step. The snapshot export solves the Snowflake case and any other platform that cannot directly query PostgreSQL.

### Acceptance criteria

1. a pipeline can download the full active rules in a single HTTP call
2. the output format is flat CSV, one file per entity type
3. the call is authenticated and logs the export in audit
4. Databricks and Fabric integration guides are live in Help with concrete steps

### What this does not include

1. push connectors or CDC
2. scheduled export jobs inside the product
3. Snowflake-native connector (the client handles stage loading from the downloaded file)

## v0.4 - Documentation Discovery

### Scope

Introduce a small but useful discovery mode from documentation only.

Inputs:

1. markdown
2. text documents
3. pasted business notes
4. simple operational documentation

Supported candidate types:

1. mapping
2. group
3. parameter
4. unknown

### Execution model

1. user uploads or pastes text
2. system chunks the content
3. LLM extracts candidate JSON against a strict schema
4. backend validates schema
5. candidates are stored with evidence
6. user reviews and promotes manually

### Acceptance criteria

1. the system never publishes directly from document extraction to final rule tables
2. every candidate includes evidence snippet
3. every candidate includes confidence and review requirement
4. all promotion remains manual

## v0.5 - External Candidate Input

### Scope

Allow MDM Lite to accept candidate packs coming from stronger upstream analyzers.

Example source kinds:

1. documentation
2. legacy2lake
3. sql
4. notebook
5. orchestration

### Acceptance criteria

1. the candidate contract is source-agnostic
2. MDM Lite can review external candidate packs without knowing how they were generated internally
3. promotion rules remain unchanged

## Cross-Cutting Requirements

### Candidate contract

Any future candidate input should minimally support:

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

Regardless of future smarter inputs, downstream technical consumers should keep reading from stable approved active views.

## Not Planned For Near Term

1. full codebase analysis inside MDM Lite
2. replacing Purview or Unity Catalog
3. autonomous LLM write actions
4. multi-company enterprise scope
5. enterprise-grade full MDM workflows

## Strategic Link With Legacy2Lake

Future integration should be shaped like this:

1. Legacy2Lake or another analyzer extracts structured candidates
2. MDM Lite receives candidate packs
3. MDM Lite handles review, governance, approval, and promotion
4. downstream consumers keep reading stable active contracts

This preserves clean boundaries between analysis and governance.

## Immediate Next Steps

1. v0.3.1: snapshot export + platform guides (Databricks, Fabric)
2. v0.4: documentation discovery from markdown and business notes
3. v0.5: external candidate input from upstream analyzers

## Success Condition

MDM Lite should evolve into a lightweight but reliable governed destination for operational business rules, regardless of whether they enter manually, by file, from documentation, or from upstream analyzers.
