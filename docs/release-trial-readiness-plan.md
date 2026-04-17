# Release Trial Readiness Plan

## Objective

Convert the current functional MVP into a trial-ready installable release before adding new product features.

This phase is intentionally focused on productization, installation, supportability, and repeatable validation.

## Scope

This phase includes:

1. Windows-first installation flow
2. minimal release packaging and startup flow
3. environment validation and configuration guidance
4. smoke-test and trial verification checklist
5. troubleshooting and support baseline
6. release go/no-go criteria

This phase does not include:

1. candidate review functionality
2. public website work
3. new external integrations
4. IAM or RBAC expansion
5. connector development for other platforms

## Desired Outcome

At the end of this phase, a controlled user should be able to:

1. prepare PostgreSQL
2. configure the application
3. start the application on Windows
4. validate DB connectivity and login
5. execute a short smoke test
6. understand what is supported and what is out of scope

## Workstreams

### 1. Installation Baseline

Deliverables:

1. one primary Windows installation path
2. clear prerequisite list
3. release-oriented environment template
4. release startup flow separated from developer flow

Exit criteria:

1. install steps do not require repo archaeology
2. app can be started from a documented release procedure
3. a remote PostgreSQL setup is treated as a normal supported path

### 2. Validation Baseline

Deliverables:

1. short post-install checklist
2. DB health verification step
3. login verification step
4. functional smoke sequence for mappings, approvals, and active views

Exit criteria:

1. a new operator can determine in minutes whether the install is healthy
2. the existing validation reports remain green
3. smoke testing has a single recommended path

### 3. Operational Baseline

Deliverables:

1. minimal diagnostics guide
2. common failure guide
3. support boundary statement
4. upgrade and rollback expectations for the first trial

Exit criteria:

1. common failures have first-response guidance
2. log locations and health checks are documented
3. trial users know what the product team supports in this phase

### 4. Release Decision Baseline

Deliverables:

1. release candidate checklist
2. trial acceptance criteria
3. known limitations list
4. evidence package based on current reports

Exit criteria:

1. trial readiness is a yes or no decision, not an intuition
2. open limitations are explicit and accepted

## Execution Sequence

### Week 1

1. consolidate installation path
2. simplify prerequisites and runtime configuration
3. confirm release startup procedure
4. align docs and scripts with the chosen release path

### Week 2

1. formalize smoke checklist
2. formalize troubleshooting and support baseline
3. run fresh-install style validation
4. close release candidate checklist

## Executable Backlog

### Phase 1 - Installation Closure

Goal:

Make the Windows-first installation path short, unambiguous, and trial-usable.

Tasks:

1. confirm the single recommended entrypoint for first-time install
2. separate release instructions from developer instructions where still mixed
3. verify `.env` expectations against the actual guided setup flow
4. confirm the production startup path and standalone runtime behavior
5. close remaining wording gaps between `README.md`, `docs/windows-installation.md`, and scripts

Definition of done:

1. one install path is clearly preferred over all alternatives
2. a new operator can complete setup without guessing which script to run
3. release docs and actual script behavior match

### Phase 2 - Validation Closure

Goal:

Make post-install verification fast and repeatable.

Tasks:

1. define the minimum smoke path after installation
2. define the minimum evidence required to say the install is healthy
3. align smoke instructions with `/api/health/db`, login, and one CRUD plus approval flow
4. make the remote validation flow part of the recommended release check
5. ensure the reports to keep are explicit and not left to interpretation

Definition of done:

1. a user can confirm health in a few minutes
2. the same smoke path is used every time
3. the validation outcome is recorded with named reports or checklist evidence

### Phase 3 - Operational Closure

Goal:

Define what happens when the install works, and what happens when it does not.

Tasks:

1. document common failure classes for env, DB reachability, SSL, login, and startup
2. define the minimum diagnostic artifacts to request in a support situation
3. define support boundaries for the first controlled trial
4. define what changes are allowed during the trial and what counts as out-of-scope support

Definition of done:

1. trial support starts from a documented playbook
2. known limitations are visible before the trial begins
3. support boundaries are explicit enough to avoid informal scope growth

### Phase 4 - Release Decision

Goal:

Turn readiness into a concrete go or no-go decision.

Tasks:

1. create release candidate checklist
2. create known limitations register
3. create trial acceptance criteria
4. identify which evidence artifacts are required before sign-off
5. define who can declare the build trial-ready

Definition of done:

1. readiness is decided against written criteria
2. limitations are accepted intentionally, not discovered ad hoc
3. the team can say exactly why the release is or is not ready

## Delivery Cadence

### Sprint A - Packaging And Installability

Primary output:

1. locked installation path
2. aligned setup and startup docs
3. trial-oriented runtime configuration guidance

### Sprint B - Validation And Supportability

Primary output:

1. locked smoke path
2. fresh-install style validation evidence
3. troubleshooting and support baseline

### Sprint C - Release Sign-Off

Primary output:

1. release checklist
2. known limitations
3. trial acceptance decision

## Suggested Task Ownership Model

The work should be treated in three operating lanes:

1. installability lane - scripts, startup path, packaging behavior
2. validation lane - smoke path, reports, repeatable verification
3. product operations lane - support boundary, limitations, release decision

The same person can execute all lanes in a small team, but the lanes should remain distinct when tracking progress.

## Decision Points To Close Early

These decisions should be closed before doing broad implementation work:

1. what exact script is the official first-run path
2. whether certificate-path support is needed now or deferred
3. what exact evidence is mandatory for trial sign-off
4. who the first controlled trial is actually for

## Risks

Main risks in this phase:

1. mixing developer convenience with release documentation and confusing operators
2. treating a green local install as enough without repeatable remote validation
3. expanding scope into product features before installability is really closed
4. leaving support assumptions implicit and discovering them during the trial

## Recommended Immediate Next Actions

1. confirm the official Windows first-run path as the single recommended entrypoint
2. convert the release checklist into a concrete document in `docs/`
3. add a dedicated troubleshooting and support-baseline document
4. run one fresh-install style rehearsal against the chosen path and record the evidence

## Suggested Working Method

For this phase, every change should answer one of these questions:

1. does it make installation simpler
2. does it make trial validation more repeatable
3. does it make support easier
4. does it reduce ambiguity in what is supported

If the answer is no, it likely belongs to a later phase.

## Trial Go/No-Go

Trial-ready means all of the following are true:

1. documented install path works on Windows
2. remote PostgreSQL validation remains green
3. smoke verification can be executed by someone other than the author
4. login, CRUD, approval, import, and active-view consumption are demonstrable
5. known limitations are documented
6. support expectations are explicit

## Dependencies

This plan depends on the current foundation direction already established in:

1. `technical-foundation-plan.md`
2. `current-state-and-contracts.md`
3. `testing/README.md`

## Out-of-Scope But Related

There is a future public-site initiative to present the broader product family. That work is intentionally separate from this release-readiness phase and should be planned as an adjacent track after the installable baseline is closed.