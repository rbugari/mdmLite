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

## Release Direction

## v0.2 - Operational Hardening

### Scope

1. login for admin
2. approval workflow visible in UI
3. audit trail visible by record or entity
4. non-destructive update strategy for approved records
5. richer filters and pagination
6. import preview before confirmation

### Acceptance criteria

1. rules can move through draft, pending, approved, rejected, inactive
2. approved records are not edited destructively
3. audit can be inspected
4. the admin flow is authenticated

## v0.3 - Candidate Review Layer

### Scope

1. introduce candidate storage
2. support candidate review and promotion
3. separate detected suggestions from approved rules
4. define stable candidate contract with evidence and confidence

### Acceptance criteria

1. a candidate can be reviewed without entering production tables
2. approved candidates can be promoted to mappings, groups, or parameters
3. evidence remains visible throughout the review process

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

1. harden governance first
2. add candidate layer second
3. add documentation discovery third
4. add external candidate ingestion after the candidate layer is stable

## Success Condition

MDM Lite should evolve into a lightweight but reliable governed destination for operational business rules, regardless of whether they enter manually, by file, from documentation, or from upstream analyzers.
