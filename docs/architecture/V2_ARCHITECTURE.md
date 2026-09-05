# Quizzes.it V2 Architecture

Status: Phase 0 design for owner review

Baseline: `v1-production-baseline-2026-09-05` at `9be4a639bd7d44a8db79d12c5b804ed5a4cdcc07`

Observation date: 2026-09-05 (Asia/Hong_Kong)

Scope: architecture only; no application, test, Docker, production, payment, price, or data change

## Evidence convention

- **FACT** — directly supported by the baseline repository or the owner-supplied baseline record. Repository paths are the source; no network sources were used. Retrieval window: 2026-09-05 during Phase 0. Confidence: high unless stated otherwise.
- **OBSERVATION** — interpretation of those facts and its limits.
- **HYPOTHESIS** — a testable architecture claim, not a verified outcome.
- **RECOMMENDATION** — the proposed V2 rule or action.

## Goal and non-goals

**FACT:** V2 is a modular refactor of the current paid, private, bilingual quiz product. The required maintenance outcome is: small change → small affected scope → targeted QA → small review → done.

**RECOMMENDATION:** Build V2 as a modular monolith. Keep one deployable service until measured operational or scaling evidence justifies a separate process. Separate responsibilities inside the repository through owned modules, public contracts, dependency rules, and targeted test suites.

**RECOMMENDATION:** Preserve current customer behaviour behind compatibility adapters while modules are extracted incrementally. V2 does not introduce live LLM-generated questions/results, microservices, analytics implementation, GTM, GA4, consent implementation, a new price, a new payment flow, or a new data lifecycle.

## Current V1 architecture

**FACT:** The secure production entry point is `app-secure.js` (567 lines). It serves the static shell, implements the HTTP router, reads/writes the JSON purchase store, expires records, rate-limits checkout, calls Stripe, verifies webhooks, creates/encrypts/hashes access tokens, sends/retries access email, drives quiz runtime calls, and persists sessions/results.

**FACT:** `public/index.html` holds the document shell and a large succession of embedded style layers. `public/multi-quiz.js` (501 lines) holds client routing, catalogue/detail/preview/checkout/access/result/legal rendering, fetch calls, browser state, navigation, locale handling, DOM translation patches, and `quiz-flow` event emission.

**FACT:** `v31/source.js` reads two differently shaped source packs and normalizes them into runtime quiz objects. Eleven thin files under `v31/quizzes/` register IDs through `v31/index.js`. `v31/production-adapter.js` combines public catalogue projection, publication lookup, a hard-coded `2900`/`hkd` price, preview/runtime replay, localization views, and result invocation.

**FACT:** Runtime behavior is already partly separated into pure modules: `v31/scoring.js`, `v31/selector.js`, `v31/stopping.js`, and `v31/engine.js`. `v31/result-builder.js` combines evidence selection, Truth Packet assembly, authored result mapping, derived customer content, and the returned persistence/API object. `public/multi-quiz.js` presents that object.

**FACT:** The server persists purchases, preview sessions, adaptive session state, completed answers, and completed results in `/data/purchases.json`. Existing purchase lookup falls back to `defaultQuiz.id` and `defaultQuiz.version` when legacy records have no quiz identity/version.

**FACT:** The owner-recorded Mac baseline is 111 tests: 109 pass and 2 fail. Tests are mostly module-level Node tests, with source-text tests for the monolithic HTML/JavaScript shell. The two known baseline failures read `/opt/quizzes/app/public/multi-quiz.js` directly: `tests/v31-rendered-shell-navigation.test.mjs` and `tests/v31-traditional-chinese-copy.test.mjs`. Phase 0 must record, not fix, this portability coupling.

## Major coupling and why it matters

| Coupling | Baseline evidence | Consequence |
|---|---|---|
| HTTP, commerce, persistence, access, email, and runtime in one server file | `app-secure.js` | A small backend change invites broad inspection and route regression. |
| Page routing, all flows, result UI, localization patches, and event emission in one browser file | `public/multi-quiz.js` | Navigation or copy edits can affect quiz/payment/result code. |
| Public product projection also owns price and runtime replay | `v31/production-adapter.js` | Catalogue, pricing, runtime, and results share a change surface. |
| Two content-pack schemas normalized at runtime | `v31/source.js`, `v31/source/*.json` | Content shape and migration compatibility are implicit. |
| Presentation cleanup mutates normalized content objects | `v31/presentation-copy.js` | Source wording, localized presentation, and canonical content are not clearly separated. |
| Truth, interpretation, content, and persisted result object built together | `v31/result-builder.js` | Result presentation/content changes can appear coupled to evidence/scoring. |
| Price appears in server projection, source metadata, and literal UI/localization copy | `v31/production-adapter.js`, `v31/source/rel06-rel13-v2.json`, `public/multi-quiz.js` | A global price change risks inconsistent display and charge amounts. |
| Environment-specific paths in server and tests | `/app/public/*` in `app-secure.js`; `/opt/quizzes/app/*` in two tests | Local, CI, container, and production behavior are not uniformly portable. |
| Historical/prototype artifacts coexist with production code | root legacy files, prototypes, `quiz-launch-site/`, `shadow-self-prototype/` | A maintainer can select the wrong source of truth without explicit boundaries. |

**OBSERVATION:** V1 contains useful modular runtime pieces, but orchestration and presentation seams are broad. The problem is primarily responsibility placement and implicit contracts, not a need to rewrite deterministic logic. Confidence: high.

## Proposed V2 modular monolith

The directory names below are target names for later approved phases, not files created in Phase 0.

```text
src/
  shared/
    schemas/              # versioned cross-module data contracts
    errors/               # stable error codes, not UI copy
    utilities/            # dependency-free primitives only
  quiz/
    contracts/            # QuizContract and compiled assessment schemas
    registry/             # quiz identity/version/publication lookup
    content/<quiz>/<ver>/ # questions, options, evidence, result source copy
    authoring/             # versioned AuthoringProfile rules and validators
    runtime/               # scoring, selector, stopping, deterministic engine
    results/
      truth/               # evidence-backed ResultTruth
      content/             # localized ResultViewModel construction
  commerce/
    pricing/               # one server-authoritative PricingPolicy
    payments/              # checkout/webhook application services + Stripe adapter
    purchases/             # purchase/access domain + repository port/adapters
  email/                   # access-email policy/template + delivery port/adapters
  localization/            # locale policy, message catalogues, translators
  backend/
    api/                   # route handlers and public API DTO mapping
    application/           # use cases coordinating domain ports
    bootstrap/             # composition root and server start
  website/
    shell/                 # layout, navigation, footer, language control
    pages/                 # landing, catalogue, legal/support, status pages
    quiz-flow/             # preview and paid question presentation/controllers
    checkout/              # checkout form/presentation; no price authority
    results/               # ResultViewModel renderer only
tests/
  unit/<module>/
  contract/
  integration/<flow>/
  browser/<journey>/
```

### Responsibility boundaries

1. **Website/UI** renders API DTOs and result view models and controls browser navigation and accessibility. It never calculates price, score, access eligibility, or result truth, and it acquires no new analytics dependency during V2.
2. **Backend/API** parses HTTP, invokes application use cases, maps stable DTOs/errors, and serves assets. Route handlers contain no Stripe, persistence, scoring, or email implementation.
3. **Quiz Registry / Catalogue** owns quiz identity, slug, version availability, publication state, category, and public metadata references. It does not own questions, price, checkout, or UI markup.
4. **Quiz Contracts** owns the versioned semantic promise and the compiled data schemas used across authoring, runtime, and results.
5. **Quiz Content** owns customer wording, question/option metadata, and evidence mappings per immutable quiz content version.
6. **Quiz Runtime** is a deterministic pure consumer of a compiled assessment plus prior state/answer. It owns scoring, selection, stopping, adaptive state, and deterministic completion—not authoring style.
7. **Quiz Results** is a pipeline: runtime outcome → immutable Result Truth → localized Result View Model → UI presentation.
8. **Quiz Authoring** owns versioned creation rules and static validation. It is a build/review-time concern and is never imported by customer runtime.
9. **Pricing Policy** resolves current offers server-side from one policy. Catalogue and checkout receive projections/snapshots; quiz content contains no authoritative charge amount.
10. **Payments** owns Stripe checkout request construction, signature verification, supported paid-event handling, and provider mapping. It cannot grant access except through the purchase application service.
11. **Purchases / Access** owns purchase state transitions, compatibility reads, token lifecycle, expiry, retakes, and repository ports.
12. **Email** owns access-email copy/model, delivery state, idempotent retry, and provider adapter. It receives an already-authorized access delivery request.
13. **Localization** owns locale resolution and message catalogues. Quiz-local content remains with the quiz content/result content version; generic shell/commerce/email copy uses domain catalogues.
14. **Shared Schemas / Utilities** contains versioned DTO/value schemas and dependency-free utilities only; it must not become a miscellaneous dependency bucket.
15. **Analytics** is a reserved responsibility boundary only. V2 defines no analytics event schema, port, sink, adapter, consent implementation, provider integration, or analytics-related runtime code.

## Dependency direction

```text
entrypoints (backend bootstrap, website)
        ↓
application use cases / UI controllers
        ↓
domain public APIs (quiz, results, pricing, purchases, payments, email)
        ↓
shared schemas and dependency-free utilities

external adapters (Stripe, JSON/file repository, Resend, HTTP, browser DOM)
        └── implement ports owned by the consuming application/domain module
```

**RECOMMENDATION:** Dependencies point inward. Domain modules do not import backend routes, DOM code, provider SDKs, environment variables, or concrete persistence. Adapters may import domain-owned interfaces; domain code must not import adapters.

**RECOMMENDATION:** Cross-domain access happens only through each module's public entry point and versioned schemas. Deep imports into another module are prohibited. A static dependency check should enforce this in a later phase.

**RECOMMENDATION:** Avoid cycles through these specific rules:

- registry may reference quiz-contract identifiers, but runtime/content/results never import the registry;
- runtime consumes compiled quiz data and produces `RuntimeOutcome` without importing results;
- result truth consumes `RuntimeOutcome` plus evidence-bearing content; result content consumes truth; result UI consumes only the view model;
- pricing knows offer policy but not quiz questions; checkout asks pricing for a resolved offer and snapshots it into the purchase;
- payment confirmation calls a purchase use case; purchases do not call Stripe;
- email delivery is triggered after a committed paid transition and cannot decide payment/access state;
- localization helpers are pure and cannot import pages or domain services.

## Explicit quiz separation

### Quiz Contract

**RECOMMENDATION:** Each quiz/version has a reviewed `QuizContract` containing identity, localized title, customer promise, non-clinical boundary, evidence model identifiers/meaning, applicable relationship stages, result promise, supported locales, and quiz-level configuration references such as allowed length/stopping policy. Contract changes are semantic and versioned.

### Authoring Profile

**RECOMMENDATION:** A separately versioned `AuthoringProfile` defines question style, scenario construction, relationship-stage applicability, social/real-world scenario rules, title relevance, curiosity progression, question-to-answer coherence, and EN/zh-Hant tone rules. It validates or guides authored material; it never selects the customer's next question.

### Quiz Content

**RECOMMENDATION:** Versioned quiz content contains questions, options, customer wording, evidence mappings/rationales, scenario domains, designed hypothesis pairs, information metadata, and localized result-source copy. Content versions are immutable once purchases reference them; corrected versions are added and the registry chooses the active version.

### Quiz Runtime

**RECOMMENDATION:** The runtime exposes pure deterministic operations such as `start`, `answer`, `next`, and `complete`. Given the same compiled quiz version, ordered answers, locale-independent evidence, and runtime version, it produces the same state and outcome.

### Quiz Result

**RECOMMENDATION:** Use three contracts:

1. `ResultTruth`: quiz/content/runtime versions, selected answers, score/ranking outcome, lead/confidence state, qualifying evidence and counter-evidence, and completion reason. No layout or promotional copy.
2. `ResultViewModel`: localized headings, explanations, evidence cards, next observations, safety copy, and stable presentation keys derived from truth plus versioned result content.
3. Result UI: responsive components and interaction state only. It may change layout without rebuilding truth or changing stored evidence.

## Answer change separation

### A. Answer wording change

**RECOMMENDATION:** Classify as `CONTENT_ONLY` only when customer-facing text changes but its behavioral meaning, evidence vector, evidence rationale, scenario domain, designed pair, and option identity remain equivalent. Require a meaning-preservation QA gate with bilingual side-by-side review, explicit reviewer attestation, unchanged mapping checksum, question-to-answer coherence checks, and representative deterministic replay comparison. Any doubt escalates to `QUIZ_EVIDENCE`.

### B. Answer evidence or logic change

**RECOMMENDATION:** Classify as `QUIZ_EVIDENCE` when behavioral meaning, evidence contribution, rationale, option identity, scenario metadata, or relationship to a hypothesis changes. Required impact analysis covers evidence mappings, score distributions, selector candidates, stopping behavior, result interpretation, fixtures, stored-version compatibility, and simulations. Wording and evidence changes must never share an automatic approval path.

## Server-authoritative pricing

**FACT:** The current public projection hard-codes `{ amount: 2900, currency: "hkd" }`; related price text also appears in source/UI content.

**RECOMMENDATION:** `PricingPolicy` is the sole current-price authority. It resolves an offer using `quizId`, optional market/context, and effective policy version. API catalogue/detail responses expose the resolved display price; checkout re-resolves and validates the offer server-side and persists an immutable offer snapshot. The browser never submits an authoritative amount. A global price change modifies one policy record plus localized generic display copy only if formatting/copy itself changes—not every quiz.

## Portable test architecture

**RECOMMENDATION:** Tests resolve repository fixtures relative to `import.meta.url` or receive paths through explicit test helpers. Application asset paths are injected/configured at the composition root. No test or domain module may depend on `/opt/quizzes/app` or `/app`.

Test layers:

- unit: pure runtime, truth, localization, pricing, token policy, mapping utilities;
- schema/contract: quiz content, public API DTOs, purchase compatibility, result truth/view model;
- module integration: registry+content, runtime+result, pricing+checkout, webhook+purchase+email state;
- browser/component: pages, navigation, bilingual rendering, responsive/accessibility behavior;
- end-to-end: preview → checkout test double/sandbox → webhook → email capture → private access → result/retake;
- release smoke: exact image health, routes, public assets, catalogue, one EN and one zh-Hant deterministic journey, with risk-triggered expansion.

**RECOMMENDATION:** Targeted QA runs first according to `CHANGE_IMPACT_MAP.md`. Full regression is risk-triggered, not the default for every edit.

## Post-V2 analytics follow-up project

**RECOMMENDATION:** Analytics implementation is outside the V2 migration and release. Only after V2 is completed and released may the owner authorize a separate analytics project to decide requirements, privacy/consent obligations, event semantics, schemas, ports, sinks, adapters, providers, retention, and QA. V2 must not add analytics event schemas, ports, no-op sinks, adapters, GTM, GA4, consent implementation, or analytics-related runtime code.

## Release and Docker provenance contract

**RECOMMENDATION:** A V2 production candidate is releasable only when:

1. the authoritative Git worktree is clean;
2. the exact source SHA is recorded before build;
3. the build date is recorded in UTC using an immutable value;
4. the image embeds `org.opencontainers.image.revision=<exact SHA>` and `org.opencontainers.image.created=<build date>`; it should also embed source URL/version labels when available;
5. validation runs against the exact immutable image digest, not a later rebuild of the tag;
6. deployment uses that tested digest;
7. the release record maps branch/tag, SHA, build date, image repository, tag, digest, test evidence, deployment time, and rollback digest;
8. post-deploy inspection verifies the running digest and embedded revision match the release record.

**RECOMMENDATION:** Do not retrofit or rebuild V1 for this contract. Introduce it only in an owner-approved V2 release phase.

## Architecture acceptance rule

**HYPOTHESIS H-ARCH-001:** If module boundaries and impact classification are enforced, routine V2 work will normally touch one owning module plus its focused tests and, when a public contract changes, only direct consumers and contract tests.

- Evidence supporting: V1 already has independently testable scoring, selection, stopping, and locale functions.
- Contrary evidence: current server/browser/result/source adapters still combine responsibilities and source-text tests inspect monoliths.
- Confidence: medium-high.
- Assumptions: public schemas are explicit, deep imports are blocked, old content versions remain readable, and targeted test suites are trustworthy.
- Test method: apply every scenario in `V2_ACCEPTANCE_SCENARIOS.md` to a proposed diff before implementation.
- Success: each routine scenario has an owner module, bounded file list, explicit non-affected modules, and a QA set proportionate to risk.
- Failure: a routine request requires unrelated shared-file edits, broad repository comprehension, or full regression without a contract/risk reason.
- Status: PROPOSED.

## Owner decisions still open

These do not block Phase 0, but must be resolved at the indicated migration gate:

1. Choose the long-term persistence adapter (retain JSON file initially versus migrate to a transactional store). Default recommendation: extract a repository port first and retain the JSON format until compatibility tests exist.
2. Choose whether content versions are source modules, normalized JSON artifacts, or generated artifacts from an authoring source. Default recommendation: one validated normalized artifact per immutable quiz version, with authoring source retained separately.
3. Choose whether old completed results are rendered from their stored view model forever or can be re-projected from stored truth. Default recommendation: preserve stored legacy result payloads; use truth/view-model versioning for new V2 results.
4. Define retention/deletion requirements more precisely than the current access-expiry cleanup behavior. This may require legal/privacy review and is not an architecture-only product decision.
5. Select the V2 frontend implementation technology only after a thin vertical slice proves the boundary. The architecture requires presentation separation, not React specifically.
## Phase 0 outcome

**RECOMMENDATION:** Owner review should accept Phase 0 only if the protected contracts, module dependency rules, change-impact matrix, acceptance scenarios, and phased strangler migration agree with one another. Phase 1 must not begin implicitly.
