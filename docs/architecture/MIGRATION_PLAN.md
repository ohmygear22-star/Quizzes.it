# V2 Migration Plan

Status: proposed phased plan; owner approval is required before Phase 1

Baseline: `v1-production-baseline-2026-09-05` / `9be4a639bd7d44a8db79d12c5b804ed5a4cdcc07`

Evidence date: 2026-09-05; local repository only, no network retrieval

## Migration strategy

**RECOMMENDATION:** Use a strangler migration inside one modular monolith. Characterize a protected behavior, introduce a versioned contract and new module behind the current entry point, switch one bounded flow, compare outputs, then remove the old path only after owner-approved release evidence. Never combine boundary extraction with an intentional product behavior change.

**RECOMMENDATION:** Each phase is independently reviewable and rollback-safe. A phase may be divided into smaller tasks. Every task starts with change classification, uses branch/worktree isolation, runs targeted tests first, commits only its bounded scope, and stops for review. Production deployment is a separate owner-approved action.

## Global constraints for every phase

- Preserve every contract in `PROTECTED_CONTRACTS.md` unless a later task explicitly approves a named change.
- Keep current HK$29 / 2900 HKD, Stripe webhook behavior, purchase/access/email lifecycle, deterministic runtime/results, English + Traditional Chinese, and current routes.
- Preserve existing purchase compatibility and historical quiz/result resolvability.
- Do not introduce live LLM runtime behavior or microservices.
- During V2, do not implement analytics event schemas, ports, no-op sinks, adapters, providers, GTM, GA4, consent, or analytics-related runtime code.
- Do not rewrite production data in place as part of module extraction.
- Keep old and new implementations comparable until the new path passes its gate.
- Prefer dependency-free extraction; any new dependency needs a specific approved reason.
- A clean Git tree, exact SHA, tested image digest, and rollback record are release requirements, not optional cleanup.

## Phase 0 — architecture and acceptance baseline

Deliverables are the seven documents named by the owner. No application/test/Docker change.

Exit gate:

- owner accepts responsibility boundaries and dependency direction;
- protected contracts are complete enough to characterize;
- all acceptance scenarios have a bounded proposed V2 surface;
- unresolved decisions are assigned to a later gate rather than silently assumed.

## Phase 1 — characterization, portable paths, and architecture test harness

Primary types: `INFRA` (test harness only), `PURCHASE_ACCESS` characterization, and module-neutral contract tests.

Planned work:

1. Inventory current customer/API/data behavior and freeze representative fixtures for public catalogue, preview, runtime, result, purchase records, access states, webhook events, and email lifecycle.
2. Replace test-only hard-coded `/opt/quizzes/app/public/multi-quiz.js` access through a repository-relative test fixture helper using `import.meta.url`.
3. Introduce configurable/injected static asset roots at the future composition seam; retain `/app/public` as container configuration, not domain knowledge.
4. Create test commands/groups for unit, contract, integration, browser, all-quiz, and full regression without changing assertions' intended behavior.
5. Add an architecture-boundary test scaffold before target modules exist, then tighten it as modules migrate.
6. Record the baseline portability result separately from functional regressions.

Targeted verification:

- both previously failing tests pass on Mac without weakening assertions;
- tests run with repository located at a different absolute path;
- full suite preserves the known functional baseline;
- no production/Droplet access is used.

Rollback: test/configuration-only revert. No data or customer behavior change.

Exit gate: owner reviews portable test evidence and characterization coverage.

## Phase 2 — shared schemas and compatibility readers

Primary types: `QUIZ_CONTRACT`, `PURCHASE_ACCESS` (schema only), `RESULT_CONTENT` schema.

Planned work:

1. Define versioned shared schemas/value objects for IDs, locale, money, public quiz DTOs, compiled quiz definition, runtime state/outcome, result truth/view model, purchase/access records, payment events, and email delivery requests.
2. Add parsers at boundaries; keep domain objects private.
3. Add legacy/current purchase fixtures and a read-compatible normalization layer with no production rewrite.
4. Add explicit schema/version fields to new V2 artifacts while preserving current API/persistence adapters.
5. Define stable error codes separately from localized customer messages.

Targeted verification: schema property/fixture tests, old record reads, unknown-field tolerance, API DTO snapshots, no secret fields.

Cross-module verification: current server adapter ↔ schemas; current UI ↔ compatible DTOs.

Rollback: keep current raw objects behind adapters; no stored record mutation.

Exit gate: every future module seam has a reviewed data contract and historical fixture.

## Phase 3 — quiz contract, authoring profile, content, and registry

Primary types: `QUIZ_CONTRACT`, `AUTHORING_PROFILE`, `CONTENT_ONLY` structure migration.

Planned work:

1. Define `QuizContract` and one or more versioned `AuthoringProfile` records.
2. Normalize both current source-pack formats into one validated compiled artifact per quiz version, preserving exact IDs, wording, evidence, stopping configuration, and result-source content.
3. Separate publication/catalogue metadata from content and central pricing.
4. Build a registry that resolves active public versions and historical purchased versions without importing every concern into one adapter.
5. Compare normalized artifacts against `tests/fixtures/v31-frozen-logic.json` and source checksums.
6. Keep existing `v31` imports as compatibility facades while consumers transition.

Targeted verification: all 11 quizzes, 270 questions, 1080 options, 44 hypotheses, 44 result blueprints, 55 QA personas; bilingual presence; unique IDs; exact evidence/stopping checksums; publication/catalogue parity.

Cross-module verification: registry ↔ API; compiled content ↔ existing runtime/results.

Rollback: switch compatibility facade back to current `v31/source.js` and `v31/index.js`.

Exit gate: one new quiz version can be added through an isolated package/registry entry without editing runtime, results engine, commerce, email, or generic UI.

## Phase 4 — deterministic runtime extraction

Primary type: `QUIZ_RUNTIME` structure migration with no algorithm change.

Planned work:

1. Move/wrap scoring, ranking, selector, stopping, and engine behind one runtime public API.
2. Remove registry imports from runtime by passing an immutable compiled definition explicitly.
3. Version persisted runtime state and provide current `v31Session` compatibility reads.
4. Preserve current selection traces, ties, error behavior, preview gate, paid unlock, and stopping outcomes.
5. Run old/new implementations in test comparison for frozen answer sequences and QA personas.

Targeted verification: scoring/selector/stopping/engine unit tests, determinism hashes, property/edge tests, all-quiz persona simulations, invalid-order/duplicate/unlock failures.

Cross-module verification: content ↔ runtime; API session orchestration ↔ runtime; runtime outcome ↔ current result builder.

Full regression: required because shared runtime is common to all quizzes.

Rollback: compatibility facade selects existing V1 runtime implementation; persisted state reader remains dual-version.

Exit gate: runtime has no UI, locale prose, authoring, registry, commerce, persistence, or provider dependency.

## Phase 5 — result truth, result content/view model, and presentation seam

Primary types: `RESULT_CONTENT`, `RESULT_PRESENTATION` structure migration.

Planned work:

1. Extract evidence selection and score-derived facts into versioned `ResultTruth`.
2. Extract localized authored/derived prose into a deterministic `ResultViewModel` builder.
3. Preserve a legacy adapter for stored `v31Result` payloads.
4. Make the website result renderer accept only a result view model.
5. Prove presentation-only fixture changes do not alter truth hashes.
6. Define explicit result-content and result-presentation change suites.

Targeted verification: truth provenance, counter-evidence, confidence, eight phases, personalities, bilingual/safety content, legacy/current rendering, desktop/mobile/a11y.

Cross-module verification: runtime ↔ truth; truth+content ↔ view model; view model ↔ website; purchase storage ↔ result versions.

Full regression: all-quiz result regression; full journey only when persisted/API shapes switch.

Rollback: current result-builder and legacy renderer remain available behind adapter/version dispatch.

Exit gate: result layout can change without modifying/retesting scoring beyond an unchanged truth contract check.

## Phase 6 — pricing and commerce boundaries

Primary types: `PRICING`, `PAYMENT`, `PURCHASE_ACCESS`, `EMAIL` structural extraction. No price or behavior change.

Suggested subphases (separate commits/reviews):

1. Central `PricingPolicy` at 2900 HKD; catalogue/detail/paywall display and checkout consume `ResolvedOffer`.
2. Extract `PurchaseRepository` port with current JSON compatibility adapter and atomic-write behavior.
3. Extract token/expiry/purchase state machine and legacy compatibility resolver.
4. Extract Stripe checkout and raw-webhook adapter; retain current API version/event rules.
5. Extract access-email model/delivery adapter and retry/idempotency behavior.
6. Thin route handlers into application-use-case calls.

Targeted verification: each module's unit/contract tests.

Cross-module verification: pricing → checkout → offer snapshot; verified paid event → idempotent activation → same-token email; access → runtime → stored result/retake; legacy record resolution.

Full regression: required for each subphase that changes an active payment/purchase/access seam, including Stripe test mode or an approved faithful provider double. No production payment call.

Rollback: retain current `app-secure.js` composition and store format until each new adapter is proven; no destructive data conversion.

Exit gate: server route code contains no embedded Stripe, file-store, crypto-policy, email-template, or runtime algorithm implementation.

## Phase 7 — website shell, pages, quiz flow, and localization

Primary types: `WEB_UI`, `RESULT_PRESENTATION`, `LOCALIZATION`; no product redesign unless separately approved.

Suggested subphases:

1. Create a structured shell/navigation/footer and route table preserving every current URL/hash.
2. Extract informational/status pages.
3. Extract catalogue/detail.
4. Extract preview/checkout/access controllers and views.
5. Extract result components using only `ResultViewModel`.
6. Replace DOM text-replacement patches with owner-specific keyed catalogues.
7. Add responsive/component/browser accessibility tests.

Targeted verification: each page/flow in both locales, keyboard/focus/menu behavior, mobile/tablet/desktop, loading/error/expired states.

Cross-module verification: API DTOs, checkout invocation, access/result view models, locale persistence/propagation.

Payment QA: only for checkout UI/API invocation changes; use test mode/double.

Full regression: when switching the global shell/router entry point.

Rollback: serve the current `public/index.html` + `public/multi-quiz.js` bundle until the replacement shell passes release review.

Exit gate: adding a page or changing navigation does not touch quiz runtime/content/commerce; result UI changes do not touch scoring/evidence.

## Phase 8 — Docker/release provenance and V2 release candidate

Primary type: `INFRA`.

Planned work:

1. Add build inputs for exact Git SHA and UTC build date.
2. Embed OCI `revision` and `created` labels and verify them from the built image.
3. Require clean authoritative worktree before release build.
4. Run the full suite and customer-journey matrix against one immutable image digest.
5. Record source SHA, build time, image tag/digest, test evidence, rollback digest, and known limitations.
6. Present RELEASE_REVIEW. Deploy only after explicit owner approval; deploy the tested digest without rebuild.
7. Verify running digest/revision and fresh health/customer smoke after any approved deploy.

Rollback: retain the previous verified image digest and data-compatible application path. No V1 retrofit/rebuild is required.

Exit gate: owner accepts release evidence and explicitly decides whether to deploy.

## POST-V2 follow-up project — analytics

This project is not Phase 9 and is not part of the V2 migration or release.

It may begin only after V2 is completed and released and the owner approves a new scope. That future project must start from fresh product, privacy, consent, retention, and measurement requirements. Only then may it consider an event schema, port, sink, adapter, provider, GTM, GA4, consent implementation, runtime integration, and corresponding QA.

## Known baseline technical debt

**FACT:** The following debt exists at Phase 0 and is not fixed here:

1. The owner-recorded Mac baseline is 111 tests (109 pass, 2 fail). The two failures hard-code `/opt/quizzes/app/public/multi-quiz.js`; Phase 0 records but does not fix them.
2. `app-secure.js` hard-codes `/app/public/*` asset paths and combines server concerns.
3. `public/multi-quiz.js` and `public/index.html` are layered monoliths with source-text/DOM translation patches and mixed page/flow ownership.
4. `v31/source.js` normalizes two source formats at runtime.
5. Price authority/display data is duplicated or embedded across adapter/source/UI copy.
6. `v31/production-adapter.js` combines catalogue, pricing, localization projection, runtime replay, and results.
7. `v31/result-builder.js` combines truth, content, derived copy, and persistence/API representation.
8. Runtime imports the global registry, making otherwise pure behavior less injectable.
9. Purchase persistence is a shared JSON file with process-local coordination; concurrency/durability limits require explicit evaluation before scaling.
10. Some scripts still reference older quiz trees that are not the current V3.1 source of truth.
11. Docker images do not yet embed the required source revision/build date contract.
12. The repository contains production, legacy, prototype, and output artifacts without an enforced source-of-truth boundary.

## Migration stop conditions

Stop the active task and return to owner review when:

- a protected contract must change rather than be preserved;
- the planned diff expands into an undeclared module/change type;
- historical purchase/result compatibility cannot be demonstrated;
- a data rewrite/destructive operation appears necessary;
- a new dependency/service/provider is proposed;
- analytics implementation or analytics-related runtime code is requested before V2 is completed and released;
- tests reveal a non-portability failure other than the two known baseline cases before Phase 1 characterization;
- payment behavior, current price, customer route, privacy promise, or live runtime output would change;
- production access/deploy becomes necessary.

## Migration success measures

**HYPOTHESIS H-MIG-001:** The phased compatibility-first migration can reach the V2 boundaries without a full rewrite or customer-visible behavior change.

- Supporting evidence: runtime algorithms already have focused files/tests and quiz IDs/versions already exist.
- Contrary evidence: the server, browser, result builder, and content adapters have implicit cross-responsibility behavior.
- Confidence: medium-high.
- Assumptions: characterization fixtures are representative and compatibility adapters can remain temporarily.
- Test method: old/new parity at every phase plus acceptance-scenario review.
- Success: each phase is independently releasable/rollback-safe, all protected contracts pass, and routine change scenarios become bounded.
- Failure: migration requires a big-bang switch, destructive data rewrite, or broad behavior change.
- Status: PROPOSED.

**HYPOTHESIS H-MIG-002:** Portable test paths and grouped suites will make targeted QA reliable across Mac, CI, staging, and containers.

- Supporting evidence: most current tests already use URL-relative repository paths.
- Contrary evidence: two tests and production asset reads use absolute environment paths.
- Confidence: high.
- Assumptions: tests do not infer container layout as product behavior.
- Test method: run from multiple checkout roots and inside an image.
- Success: identical functional results in each environment, with no `/opt/quizzes/app` dependency.
- Failure: environment path changes alter assertions or application behavior.
- Status: PROPOSED.
