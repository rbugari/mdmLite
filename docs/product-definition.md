# Product Definition - MDM Lite

## Purpose

MDM Lite is a lightweight operational reference data product for managing business rules that should not remain hardcoded in ETL, ELT, notebooks, reports, or scattered support files.

Its purpose is to centralize simple but critical rules so they can be:

1. maintained by humans through a lightweight UI
2. consumed by technical processes through stable contracts
3. governed with minimum viable control over status, validity, and traceability

## Problem It Solves

In many analytics environments, small but important business rules are implemented through:

- Excel files
- CSV files
- ad hoc lookup tables
- repeated SQL CASE statements
- hardcoded Python dictionaries
- manual maintenance in pipelines or dashboards

This creates duplication, weak traceability, and unnecessary change cost.

## What MDM Lite Is

MDM Lite is:

1. an operational store for simple mappings, groupings, and parameters
2. a lightweight administrative application over PostgreSQL
3. a controlled technical contract for downstream consumption
4. a practical alternative to unmanaged reference tables and spreadsheets

## What MDM Lite Is Not

MDM Lite is not:

1. an enterprise MDM platform
2. a golden record or survivorship engine
3. a catalog or lineage platform
4. a replacement for Purview, Unity Catalog, Collibra, dbt, or orchestration tools
5. a general-purpose knowledge graph of the full data estate

## Functional Scope

The core functional objects are:

1. mappings
   - source value -> canonical target value
2. groups
   - member value -> business group
3. parameters
   - business key/value with optional scope and validity

## Operating Principles

1. simplicity over platform sprawl
2. PostgreSQL portability over vendor lock-in
3. active-read contracts over direct table coupling
4. human review over uncontrolled automation
5. gradual governance instead of heavyweight enterprise workflow

## Positioning Against Other Tools

### vs dbt and transformation tools

MDM Lite stores business rules. dbt or pipelines apply them. MDM Lite can export a dbt seeds YAML so rules flow into the dbt project without duplication.

### vs Purview, Unity Catalog, and catalogs

Catalog platforms describe and govern assets. MDM Lite manages operational rules that transformations must apply. MDM Lite exports OpenLineage facets so catalogues can trace which datasets were built with MDM rules — without MDM Lite needing to know anything about the catalogue internals.

### vs enterprise MDM suites

Enterprise MDM suites are broader and heavier. MDM Lite focuses on reference rules where fast adoption and operational clarity matter more than full master data governance.

## Target Users

1. admin or data steward of a business rule domain
2. engineering teams that need stable rule consumption from SQL, Python, dbt, or notebooks
3. architects or analysts who need to explain how rule normalization is handled

## Technical Consumption Model

The preferred consumption model is through stable active views, not direct coupling to internal tables.

Current contract direction:

1. `vw_mdm_mapping_rule_active`
2. `vw_mdm_group_rule_active`
3. `vw_mdm_parameter_active`

For dbt projects: `GET /api/export/dbt` downloads a seeds YAML ready for `dbt seed`.
For data catalogues: `GET /api/export/openlineage` emits a COMPLETE RunEvent compatible with Purview, Marquez, and OpenMetadata.

## Current Product Boundary

MDM Lite manages operational rules. It does not attempt to replace catalogues or analyzers.

Current candidate entry modes:

1. manual create/edit via UI
2. csv/xlsx import
3. document paste → LLM extraction → human review → promote
4. external batch ingest via API key (from pipelines, Legacy2Lake, or any analyzer)

All promotion is manual. MDM Lite never autonomously publishes to final rule tables.

## Future Direction

The future direction of MDM Lite is to remain the governed destination for reusable rule candidates — not to become a universal analyzer.

MDM Lite accepts candidates from:

1. manual entry
2. csv/xlsx import
3. document discovery (LLM-assisted, already implemented)
4. external analyzers such as Legacy2Lake (batch API, already implemented)

Review, approval, and promotion remain inside MDM Lite.

Next capabilities in priority order:
1. auto-promote threshold for high-confidence candidates from trusted sources
2. validFrom normalization for extracted candidates
3. batch history and export-by-batch
4. MCP server for AI assistant integration
