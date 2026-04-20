# Functional Use Cases And Examples

## Objective

Explain each current MDM Lite capability through a concrete business use case, a simple example, and the screen or contract where it is visible.

This document is meant to reduce abstraction during demos, product discussions, and v0.3 planning.

## Recommended Starting Point

If you want to see the product with a ready-made story instead of an empty database, start with:

```bash
npm run demo:reset
```

That leaves a short didactic scenario with:

1. approved rules to show active consumption
2. pending rules to show workflow
3. audit events to show traceability

The demo is centered on two entities:

1. `CLIENT`
2. `PRODUCT`

## 1. Login And Controlled Access

### Functional Purpose

Only an authenticated admin should manage operational rules.

### Use Case

A data steward or admin needs to maintain mappings without letting every downstream developer change rules directly in tables.

### Example

The operator opens the app, signs in, and reaches the administrative home page before touching mappings, groups, or parameters.

### Where To Show It

1. Login screen
2. Home page after authentication

### What It Demonstrates

1. this is a governed admin flow, not an open spreadsheet
2. rule maintenance is separated from downstream consumption

## 2. Mappings

### Functional Purpose

Mappings normalize many raw values into one canonical value.

### Use Case

Different systems refer to the same customer or product in different ways, and analytics needs one canonical representation.

### Example

Customer aliases:

1. `ACME S.A.` -> `ACME_RETAIL`
2. `ACME SA` -> `ACME_RETAIL`
3. `MEGA STORE` -> `MEGA_STORE`

Product aliases:

1. `COFFEE PACK 1KG` -> `SKU_COFFEE_1KG`
2. `COFFEE 1 KG` -> `SKU_COFFEE_1KG`

### Where To Show It

1. `Mappings` page
2. `vw_mdm_mapping_rule_active`

### What It Demonstrates

1. replacement of spreadsheet lookup logic
2. stable normalization rules for ETL, SQL, dbt, or notebooks

## 3. Groups

### Functional Purpose

Groups map a canonical value into a business segment, category, or family.

### Use Case

Once a customer or product is normalized, the business still needs to classify it for reporting, pricing, or operational policy.

### Example

After normalizing `SKU_COFFEE_1KG`, the product can be grouped into `PREMIUM_BEVERAGES`.

After normalizing `ACME_RETAIL`, the client can be grouped into a segment such as `TOP_ACCOUNTS`.

### Where To Show It

1. `Groups` page
2. `vw_mdm_group_rule_active`

### What It Demonstrates

1. classification logic separate from raw-source cleanup
2. reusable business segmentation for downstream consumers

## 4. Parameters

### Functional Purpose

Parameters store business key/value settings with optional scope and validity.

### Use Case

A business rule is not a mapping but a configurable value such as a pricing factor, threshold, or minimum margin.

### Example

For a given client, a parameter may define:

1. `PVP_FACTOR = 1.10`

For a product, a parameter may define:

1. `MIN_MARGIN = 0.18`

### Where To Show It

1. `Parameters` page
2. `vw_mdm_parameter_active`

### What It Demonstrates

1. business settings can be governed without changing application code
2. parameters can be scoped and time-bounded

## 5. Approvals Workflow

### Functional Purpose

Operational changes should be reviewed before they affect active downstream consumption.

### Use Case

A steward proposes a new mapping or parameter, but the organization wants lightweight review before activating it.

### Example

A new alias such as `ACME RETAIL LEGACY` is proposed for `ACME_RETAIL`, but it stays in `pending_approval` until someone approves it.

### Where To Show It

1. `Approvals` page
2. pending records created by the demo scenario

### What It Demonstrates

1. detection or proposal is not the same as approval
2. the product already supports the governance pattern that v0.3 will extend

## 6. Non-Destructive Replacement

### Functional Purpose

Approved records should not be overwritten destructively when a change is needed.

### Use Case

A canonical rule must change, but history and auditability must remain intact.

### Example

An approved mapping is replaced with a new record version instead of mutating the old approved record in place.

### Where To Show It

1. edit flow from `Mappings`, `Groups`, or `Parameters`
2. follow-up inspection in `Audit`

### What It Demonstrates

1. safe change management
2. better traceability than direct table edits or spreadsheet overwrites

## 7. Audit Trail

### Functional Purpose

Users should be able to inspect what changed, who triggered it, and what approval path it followed.

### Use Case

An analyst or admin wants to understand why a rule changed or prove that a change was reviewed.

### Example

The audit shows create, submit, approve, reject, or inactivate events for a given record.

### Where To Show It

1. `Audit` page
2. direct audit links from edit tables

### What It Demonstrates

1. operational traceability
2. a lightweight compliance and review record

## 8. Imports

### Functional Purpose

Rules should not depend only on manual typing. Users should be able to load them from demo packs or uploaded files.

### Use Case

A team already has mappings or parameters in Excel and wants to bootstrap MDM Lite without retyping everything.

### Example

The operator uses demo import or uploads a csv/xlsx file, previews the result, and then confirms the load.

### Where To Show It

1. `Imports` page
2. preview and confirmation flow

### What It Demonstrates

1. practical onboarding from existing spreadsheets
2. controlled ingest instead of unmanaged file sprawl

## 9. Help And Product Explanation

### Functional Purpose

The product should explain itself to business, admin, and platform audiences.

### Use Case

Different stakeholders need different explanations: functional, executive, positioning, demo, and technical consumption.

### Example

An executive wants product boundary, a steward wants operational flow, and a data engineer wants SQL consumption examples.

### Where To Show It

1. `Help` overview
2. `Help / Demo`
3. `Help / Functional`
4. `Help / Executive`
5. `Help / Positioning`
6. `Help / Platforms`

### What It Demonstrates

1. the product has multiple audience entry points
2. adoption does not depend entirely on tribal knowledge

## 10. Technical Consumption

### Functional Purpose

Downstream processes should read stable approved active rules without coupling to write tables.

### Use Case

A dbt model, SQL job, notebook, or ETL pipeline needs normalized clients, grouped products, or scoped parameters.

### Example

SQL reads from:

1. `vw_mdm_mapping_rule_active`
2. `vw_mdm_group_rule_active`
3. `vw_mdm_parameter_active`

Example query:

```sql
select entity_type_code, source_value, target_value
from vw_mdm_mapping_rule_active
order by entity_type_code, source_value;
```

### What It Demonstrates

1. clean contract for downstream systems
2. separation between operational governance and technical consumption

## 11. Health And Installation Baseline

### Functional Purpose

The product should be installable and diagnosable without deep repo archaeology.

### Use Case

A tester or operator installs the app on Windows and needs to know quickly whether the environment is healthy.

### Example

The operator uses:

1. `scripts\\windows\\install-and-start.bat`
2. `scripts\\windows\\smoke-test.bat`
3. `/api/health/db`

### What It Demonstrates

1. release readiness for a controlled trial
2. customer-hosted operational path

## 12. Recommended Demo Walkthrough

If you want to explain the whole product in one short sequence, use this order:

1. run `npm run demo:reset`
2. show `Mappings` with client and product normalization
3. show `Groups` with segmentation or product family
4. show `Parameters` with pricing factor or minimum margin
5. show `Approvals` with pending items
6. show `Audit` with traceability
7. show one SQL query against an active view
8. close with `Help / Executive` or `Help / Platforms` depending on the audience

## 13. What v0.3 Adds On Top Of This

The easiest way to understand v0.3 is:

1. today the product already governs final rules
2. v0.3 adds a safe inbox for suggested rules before they become final rules

That means v0.3 does not replace current functionality. It adds a new layer before the current write and approval flow.