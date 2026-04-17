# Product Trial Scope

## Objective

Define the first controlled trial posture for MDM Lite so product messaging, technical scope, and demo expectations stay aligned.

## Trial Positioning

MDM Lite should be presented in the first trial as:

1. a lightweight governed rule store
2. a practical replacement for unmanaged spreadsheets and ad hoc lookup logic
3. a PostgreSQL-backed admin application for mappings, groups, and parameters
4. a stable SQL contract for downstream technical consumption

It should not be presented as:

1. enterprise MDM
2. catalog or lineage platform
3. rule discovery engine
4. public multi-tenant SaaS
5. full governance platform with enterprise IAM

## Target Trial User

The primary trial user is:

1. a small data or analytics team
2. with recurring rule-management pain
3. that needs governed updates without embedding rules in code or spreadsheets

Secondary participants may include:

1. an architect validating the product boundary
2. a data engineer validating downstream consumption
3. a business admin or steward validating operational usability

## Core Trial Use Case

The default trial scenario should be:

1. load or create mappings, groups, and parameters
2. review and approve operational changes
3. inspect the audit trail
4. consume approved active records through SQL views

This use case is strong because it demonstrates:

1. the operational UI
2. the governance layer
3. the technical read contract
4. the value versus spreadsheets and hardcoded logic

## Trial Narrative

The recommended message is:

MDM Lite gives a team one governed place to manage small but critical business rules that are otherwise duplicated across SQL, notebooks, ETL, and support files.

## Supported Scope In Trial

The first trial should explicitly support:

1. admin login
2. manual CRUD for mappings, groups, and parameters
3. approval and inactivation workflow
4. non-destructive replacement of approved rules
5. audit visibility
6. demo and file-based import flows
7. SQL consumption through active views
8. remote PostgreSQL deployment in a customer-owned environment

## Not Supported In Trial

The first trial should explicitly exclude:

1. enterprise IAM integration
2. delegated multi-team stewardship
3. public write APIs for third parties
4. automatic candidate discovery
5. multi-tenant isolation
6. packaged connectors for external platforms
7. direct inclusion of the broader public-site initiative

## Trial Success Criteria

The trial is successful if participants can clearly validate:

1. rule maintenance is easier than spreadsheets or scattered SQL
2. approval and audit are sufficient for lightweight governance
3. active views are enough for downstream technical use
4. the product boundary is understandable and credible

## Trial Assets To Prepare

1. one recommended demo scenario
2. one short platform consumption example
3. one installation and smoke-test checklist
4. one concise product explanation for non-technical stakeholders

## Decisions Deferred To Later Phases

These questions should stay open until after the first trial:

1. candidate inbox design
2. documentation discovery mode
3. external analyzer candidate ingestion
4. public product website and portfolio presentation
5. enterprise security and broader role model

## Exit Condition

This scope is complete when the team can explain, install, demonstrate, and validate the product consistently without expanding the feature boundary.