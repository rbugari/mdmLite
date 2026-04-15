# Current State And Contracts

## Objective

Describe the real current state of MDM Lite, aligned with what is implemented today, and define the technical and functional contracts that should be treated as canonical.

## Real Current State

MDM Lite currently provides a demonstrable v0.1 foundation with:

1. home page and contextual help
2. manual create and edit flows for mappings, groups, and parameters
3. demo and file-based import flows
4. PostgreSQL-backed persistence
5. active SQL views for technical consumption
6. DB health endpoint
7. bilingual UI copy and lightweight operational navigation

## What Is Implemented Today

### UI modules

1. home
2. mappings
3. groups
4. parameters
5. imports
6. help

### API surface

1. `GET/POST /api/mappings`
2. `PUT /api/mappings/[id]`
3. `GET/POST /api/groups`
4. `PUT /api/groups/[id]`
5. `GET/POST /api/parameters`
6. `PUT /api/parameters/[id]`
7. `POST /api/imports/demo`
8. `POST /api/imports/upload`
9. `GET /api/health/db`

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
4. import path for initial data load
5. stable read direction for technical consumers
6. clear product boundary and positioning

## Current Gaps

These are important because they define the next roadmap, not because the current foundation is invalid.

### Governance gaps

1. no real authentication flow
2. no real role-based authorization flow
3. no approval workflow in operation
4. no visible audit experience in UI
5. no non-destructive versioning of approved records

### Import gaps

1. no preview before confirmation
2. no batch review UI
3. import batch tables exist but are not fully used end to end
4. no documentation-driven candidate extraction yet

### UX gaps

1. no pending approval queue
2. no audit screen
3. no richer filtering by state, validity, entity, or domain
4. no pagination

### Product gaps

1. current writes are tied to a narrow client rule context
2. current parameter handling is still limited
3. no candidate review flow for suggested rules

## Functional Contract For v0.1 Baseline

For the current baseline, MDM Lite should be treated as:

1. manual rule administration plus import
2. active SQL consumption for downstreams
3. operational foundation ready for the next governance iteration

It should not yet be treated as:

1. full approval workflow product
2. authenticated public API
3. autonomous rule extraction engine
4. multi-tenant or multi-company platform

## Data Entry Modes

Current entry modes are:

1. manual create/edit
2. demo workbook import
3. uploaded csv/xlsx import

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
