# Quizzes.it V2 Agent Workflow

Status: Phase 0 operating design for Codex Desktop and Codex CLI

Baseline: `v1-production-baseline-2026-09-05` at `9be4a639bd7d44a8db79d12c5b804ed5a4cdcc07`

Evidence date: 2026-09-05; local repository inspection only

## Purpose

**RECOMMENDATION:** Agents work one bounded, reviewable change at a time. They read the architecture, classify the change, inspect only the owner module and direct contracts, run targeted QA first, commit the bounded task, and stop. They never deploy without explicit owner approval.

This workflow is interface-neutral: it applies to Codex Desktop, Codex CLI, and other owner-approved agents. Codex CLI is not tied to one model or provider.

## Authority and source of truth

Before work, establish and record:

- owner request and approval gate;
- authoritative repository/worktree and branch;
- baseline SHA and whether the tree is clean;
- allowed filesystem/file scope;
- prohibited actions and production boundary;
- target change type and owner module.

**FACT:** The standing repository guide says Agentic Quiz production artifacts/code belong on the DigitalOcean Droplet repository. The owner explicitly authorized Phase 0 documentation in this local V2 workspace as a bounded exception. This exception does not authorize later local application implementation or production access.

**RECOMMENDATION:** For future application work, follow the current owner-designated authoritative environment. Never assume a local checkout, GitHub, image, and running production service are equivalent. Record which one is being changed and which one is only a reference.

## Required reading order

An agent must read, in order:

1. repository `AGENTS.md` and any more specific `AGENTS.md` governing target paths;
2. `docs/architecture/PROTECTED_CONTRACTS.md`;
3. `docs/architecture/MODULE_BOUNDARIES.md`;
4. `docs/architecture/CHANGE_IMPACT_MAP.md`;
5. the matching scenario in `docs/architecture/V2_ACCEPTANCE_SCENARIOS.md`;
6. relevant phase/rollback guidance in `docs/architecture/MIGRATION_PLAN.md`;
7. only then, the owner module, its public contract, direct consumers, and focused tests.

Read `docs/architecture/V2_ARCHITECTURE.md` when creating a task, changing a boundary, or resolving an architecture question.

Do not begin with an unrelated repository-wide audit. Expand inspection only when a declared contract edge, failing test, or unexpected diff provides evidence that the task is broader.

## Step 1 — classify before editing

Select one primary type and any secondary types:

```text
CONTENT_ONLY
AUTHORING_PROFILE
QUIZ_CONTRACT
QUIZ_EVIDENCE
QUIZ_RUNTIME
RESULT_CONTENT
RESULT_PRESENTATION
WEB_UI
PRICING
PAYMENT
PURCHASE_ACCESS
EMAIL
LOCALIZATION
INFRA
ANALYTICS (POST-V2 only; not implementable during V2)
```

Create the impact declaration from `CHANGE_IMPACT_MAP.md`, including allowed/untouched modules, protected contracts, targeted/cross-module/full tests, payment QA, gate, and stop condition.

During V2, the Analytics responsibility is documentation-only. Any request to implement an analytics event schema, port, no-op sink, adapter, provider, GTM, GA4, consent, or analytics-related runtime code must stop and be deferred to a separately approved project after V2 is completed and released.

Special rule for answers:

- wording with equivalent behavioral/evidence meaning starts as `CONTENT_ONLY` but must pass the meaning-preservation gate;
- changed meaning, rationale, evidence vector, scenario metadata, or logical contribution is `QUIZ_EVIDENCE`;
- uncertainty is `QUIZ_EVIDENCE`, never an automatic wording-only decision.

Special rule for authoring:

- question style/scenario/tone/coherence rules are `AUTHORING_PROFILE`;
- adaptive selection, scoring, and stopping execution are `QUIZ_RUNTIME`;
- applying new authoring rules to published questions is an additional content/evidence change, not part of the rules-only task.

## Step 2 — set a bounded task and workspace

One task must have:

- one observable outcome;
- one owner module;
- explicit file paths or a narrow path boundary;
- named direct consumers when a public contract changes;
- a focused test plan;
- a rollback/revert plan;
- a clear review/stop boundary.

Use a dedicated branch and, when appropriate, a separate Git worktree. Before editing:

```bash
git branch --show-current
git rev-parse HEAD
git status --short --branch
```

Preserve unrelated uncommitted work. Do not reset, overwrite, stage, or commit another task's files. If safe isolation is not possible, stop and report the conflict.

Branch/worktree isolation does not grant production, deploy, spending, provider, or destructive authority.

## Step 3 — choose model capability by risk

**RECOMMENDATION:** Select an owner-approved model based on task risk, ambiguity, and reasoning complexity—not brand loyalty or a permanent CLI default. Available choices may include OpenAI Sol, Terra, Luna, GLM, or other approved models; availability and exact capabilities must be checked at task time.

| Risk/complexity | Typical work | Selection guidance |
|---|---|---|
| High | Architecture boundaries, security, payments/webhooks, purchases/tokens/data migration, unresolved cross-module failures, release review | Use the strongest approved reasoning model appropriate to the environment; require independent review and full evidence. |
| Medium | New module behind established contracts, quiz evidence/result logic, localization-wide change, complex UI flow | Use a capable general coding/reasoning model; escalate if contracts or failures become ambiguous. |
| Low | Mechanical rename, isolated copy edit with semantic gate, fixture regeneration from an approved deterministic tool, bounded documentation | A cheaper/faster approved model is acceptable with the same scope and verification rules. |

Model cost does not lower test or approval requirements. A cheaper model must not be assigned work whose failure could charge money, expose access, corrupt data, or silently change quiz truth unless bounded by strong tests and review. Reclassify/escalate when hidden complexity appears.

## Step 4 — inspect the minimum sufficient context

Inspect:

- owner module public API and implementation portion being changed;
- exact protected contracts involved;
- direct imports/consumers of changed public APIs;
- targeted and contract tests;
- current diff/status.

Do not repeatedly read unrelated quizzes, payment modules, UI, or infrastructure “for safety.” The Change Impact Map defines when cross-module or full inspection/testing is justified.

**OBSERVATION:** Narrow inspection is safe only when public contracts and dependency checks are reliable. Until the relevant V2 boundary is migrated, V1 monolith changes may legitimately need broader inspection; record that as migration coupling rather than pretending isolation exists. Confidence: high.

## Step 5 — implement with contract-first tests

For an approved implementation task:

1. Add/adjust the smallest test that expresses the intended behavior or contract.
2. Run it and confirm the expected baseline/failure when applicable.
3. Make the minimum in-scope implementation.
4. Run targeted unit/schema/content/component tests.
5. Run direct cross-module contract tests when the boundary changed.
6. Run other-quiz, payment, or full regression only when the impact declaration requires it.
7. Inspect the diff for unrelated or generated changes.

Do not combine refactoring with a behavior change. First preserve behavior behind a contract; propose the product behavior change separately.

For protected legacy behavior, use compatibility fixtures and old/new parity tests. For deterministic runtime/results, compare stable structured outputs rather than relying only on rendered text.

## Step 6 — evidence and hypothesis discipline

Substantive work reports use:

- **FACT:** dated, source-backed evidence with source path/URL, observation/retrieval window, and confidence;
- **OBSERVATION:** interpretation plus limits;
- **HYPOTHESIS:** testable unproven claim;
- **RECOMMENDATION:** proposed action and reason.

For external dynamic intelligence (trends, audience, competition, price strategy, marketing, sales), use the routed intelligence skill and current sources. Record URLs, observation dates, retrieval windows, supporting/contrary evidence, and confidence. Competitor research covers patterns only and must not copy questions, result text, distinctive wording, assets, or paid content.

Every hypothesis record contains:

```text
ID
claim
supporting evidence
contrary evidence
confidence
assumptions
test method
measurable success criteria
measurable failure criteria
status: PROPOSED | TESTING | SUPPORTED | NOT_SUPPORTED | INCONCLUSIVE | RETIRED
```

## Step 7 — verification order

Evidence must be fresh in the task turn/session before claiming completion:

1. targeted tests for the owning module;
2. cross-module contract tests required by classification;
3. affected-quiz/all-quiz regression required by classification;
4. payment/access/email integration when required;
5. full regression when required;
6. formatting/static/dependency-boundary checks;
7. `git diff --check`;
8. `git status --short` and diff/name/status/stat review against authorized paths.

For website changes, validate EN and zh-Hant, desktop and mobile (tablet when layout risk exists), keyboard/focus/accessibility, route/error/loading states, and the affected complete customer path. Use `website-qa` for independent release validation before RELEASE_REVIEW.

For production release candidates, validate the exact image digest that would be deployed and verify OCI revision/build-date labels. Do not claim local tests prove production.

## Step 8 — review, commit, and stop

At the bounded task boundary:

- summarize outcome first;
- list classifications and protected contracts;
- report exact files changed;
- report commands and pass/fail counts, including known baseline failures;
- show remaining risks/limitations and rollback;
- review `git diff` and ensure only task files are staged;
- commit the bounded task when the owner/workflow has authorized commits;
- record commit SHA;
- stop for the required owner/product/release review.

Do not bundle the next task. Do not push, merge, deploy, change price, enable live payments, spend money, publish marketing, or perform destructive work without the relevant explicit owner approval.

## Approval gates

- **IDEA_REVIEW:** evidence, opportunity score, risks, proposed direction.
- **PRODUCT_REVIEW:** quiz draft, QA outcome, commercial package, open issues.
- **RELEASE_REVIEW:** implementation evidence, validation, known limitations, exact release/rollback plan.
- **MARKETING_REVIEW:** objective, audience, creative, spend, metrics, stop criteria.

Silence is not approval. Approval for reversible workspace implementation does not imply approval for production, deployment, provider writes, price changes, or spending.

## Stop and escalate conditions

Stop the task when:

- the diff needs a module/file outside the authorized or declared impact scope;
- a protected contract would change;
- wording-only meaning preservation is uncertain;
- historical purchase/session/result compatibility fails;
- a test reveals unexplained behavior outside the task;
- production access, deployment, price/payment change, external spend, or destructive action is required;
- secrets/customer data may be exposed;
- a dependency/microservice/provider is needed but not approved;
- the authoritative source or baseline cannot be established.

Report concrete evidence and the smallest owner decision needed. Do not work around approval gates.

## Task record template

```text
Task:
Owner request / approval reference:
Authoritative environment:
Branch / baseline SHA:
Working-tree state:
Primary / secondary change types:
Owner module:
Allowed files:
Explicitly untouched modules:
Protected contracts:
Targeted QA:
Cross-module QA:
Other-quiz regression:
Payment QA:
Full regression:
Model selected and risk rationale:
Implementation outcome:
Verification evidence:
Known limitations:
Rollback:
Commit SHA:
Next approval gate / STOP:
```

## Workflow acceptance hypothesis

**HYPOTHESIS H-WORK-001:** If agents consistently use this workflow, routine V2 maintenance will produce smaller diffs and reviews without weakening protected-contract QA.

- Supporting evidence: the architecture assigns explicit owners and impact-specific tests.
- Contrary evidence: V1 boundaries are not yet migrated, so early tasks may remain broader.
- Confidence: medium.
- Assumptions: agents stop when scope expands and reviewers enforce dependency rules.
- Test method: compare declared versus actual module/test scope for the first ten V2 tasks.
- Success: at least eight tasks remain within declared scope, all required QA is recorded, and no protected-contract defect escapes.
- Failure: repeated undeclared cross-module edits, unexplained full-suite dependence, or skipped owner gates.
- Status: PROPOSED.
