# V2 Change Impact Map

Status: Phase 0 architecture control

Evidence date: 2026-09-05

Source: baseline repository `9be4a639bd7d44a8db79d12c5b804ed5a4cdcc07` and owner requirements; no network used

## How to use this map

**RECOMMENDATION:** Before editing, select one primary change type and any secondary types. Record affected modules, protected contracts, targeted tests, cross-module tests, regression scope, and approval gate. If the actual diff crosses the declared boundary, stop and reclassify before continuing.

Definitions:

- **Targeted QA** tests the owner module and exact changed behavior.
- **Cross-module QA** tests each changed public contract with its direct consumers.
- **Quiz regression** means deterministic fixtures/simulations for the affected quiz(es).
- **All-quiz regression** means deterministic runtime/result contract coverage across every published and still-resolvable version.
- **Full regression** means the full automated suite plus required end-to-end/browser/release checks. It is triggered by broad contracts or high-risk integration, not documentation wording alone.

## Impact matrix

| Type | Modules allowed to change | Expected untouched modules | Targeted QA | Cross-module QA trigger | Full regression trigger |
|---|---|---|---|---|---|
| `CONTENT_ONLY` | One/all versioned quiz content wording/localized result source; content validation fixtures | Runtime algorithms, evidence vectors/rationales, contracts, pricing, payments, purchases, email, generic website | Schema/content validation, bilingual copy, Q→A coherence, uniqueness, meaning-preservation gate, mapping checksum, affected-quiz truth replay | Public metadata/result-view copy schema changes | Never for proven wording-only; required if gate fails/reclassification occurs |
| `AUTHORING_PROFILE` | Versioned authoring profiles, authoring validators/docs | Existing published content, runtime/selector/stopping, results, commerce, website | Profile schema/rule examples, EN/zh-Hant tone, scenario/stage/title/curiosity/Q→A checks | Validator/compiler interface changes | Only if migration also regenerates published content or changes runtime contracts |
| `QUIZ_CONTRACT` | Quiz contract/version, registry reference, compiler/schema, affected content | Unrelated quiz content; commerce/UI except direct DTO consumers | Contract schema, safety/promise/stage rules, affected content compilation | Always: registry, runtime input, result, persistence resolver/API DTO consumers | When contract is shared across all quizzes, changes persisted/API semantics, or lacks compatibility adapter |
| `QUIZ_EVIDENCE` | Affected quiz content version, evidence mappings/rationales/metadata; fixtures/simulations; result interpretation where needed | Generic website shell, pricing/payments/email unless contract altered | Evidence schema, score distributions, selector/stopping paths, truth/result interpretation, bilingual semantic QA, affected-quiz simulations | Always: runtime+truth; persistence/version resolution when replacing active version | All-quiz only if shared evidence schema/algorithm changes; full if shared runtime/result contract or historical compatibility changes |
| `QUIZ_RUNTIME` | Runtime engine/scoring/selector/stopping and runtime schemas/tests | Authored wording, website layout, pricing/payments/email | Unit/property/fixture tests for changed algorithm, determinism, edge/tie/error cases | Always: compiled content input, API session orchestration, result truth, persisted session compatibility | Always for shared runtime changes across quizzes; payment QA only if unlock/continuation boundary changes |
| `RESULT_CONTENT` | Versioned result-content sources and view-model builder | Runtime/scoring/evidence, result UI structure, commerce/access | Bilingual content/schema/safety, truth→view-model fixtures, affected quizzes/personas | ResultViewModel schema changes or stored result projection changes | All-quiz result regression when shared result content/template logic changes; full only on schema/persistence/customer-flow impact |
| `RESULT_PRESENTATION` | Website result components/styles/a11y and UI snapshots | Truth builder, runtime, evidence/content, pricing/payment/access/email | Component/browser tests, EN/zh-Hant, desktop/mobile, legacy/current view models, keyboard/a11y | ResultViewModel contract or route/access controller changes | Full browser regression for shared shell/router changes; no runtime full regression for presentation-only |
| `WEB_UI` | Website shell/pages/navigation/flow components/styles/localization keys | Runtime/evidence, server price authority, payment verification, purchase storage, email | Changed page/component, responsive breakpoints, keyboard/a11y, both locales, route behavior | API DTO/client controller or shared shell/router changes | When global shell/router/build entry changes across all journeys; payment QA only when checkout UI/API invocation changes |
| `PRICING` | Central pricing policy/config, price projection DTOs, generic localized price display, pricing tests | Quiz questions/evidence/runtime/results, purchase history except new snapshot behavior, email unless it states price | Money/policy/effective-date tests, catalogue/detail/paywall display, server checkout amount, old snapshot compatibility | Always: registry/API projection + checkout + purchase snapshot; Stripe test mode/sandbox | Always for actual price/currency/policy change before release; owner approval required |
| `PAYMENT` | Payment application/Stripe adapter/webhook mapping, payment config/tests | Quiz content/runtime/result; email copy; UI except direct checkout contract | Checkout creation, raw signature/tolerance, event mapping, idempotency, errors, no client price authority | Always: pricing + purchase activation; checkout UI contract if DTO changes; email state after paid transition | Always, including Stripe test-mode end-to-end; production change/deploy requires owner approval |
| `PURCHASE_ACCESS` | Purchase state machine/repository, token/expiry/retake/session services, access API/tests | Quiz authorship/UI styling/pricing policy/payment signature/email provider | Legacy/current fixtures, transition/idempotency, crypto/token/expiry, preview prefix, resume/result/retake | Always: payment activation, email delivery request, registry version resolver, runtime session, access API | Always because paid access/customer data compatibility is critical; destructive migration separately prohibited without approval |
| `EMAIL` | Email domain/template/localization/provider adapter/retry tooling/tests | Payment verification, purchase authorization/token creation, quiz runtime/results, web UI | EN/zh-Hant rendering, address/link/model, idempotent sent/failed/retry, provider contract double | Purchase delivery DTO/state or access URL contract changes | Full commerce/access regression when lifecycle/state changes; provider-copy-only can use targeted+integration QA |
| `LOCALIZATION` | Locale policy/catalogues and localized fields owned by affected domain | Evidence weights/runtime, payment/purchase semantics, unrelated locale owners | Key completeness, fallback/normalization, EN/zh-Hant rendering, HK natural written review, unchanged IDs/mappings | Shared locale schema, saved locale, API/email/result propagation changes | Full bilingual customer journey when shared locale resolution or global catalogues change |
| `INFRA` | Build/container/config/release scripts/manifests and infra tests/docs | Domain behavior/content unless explicitly included | Clean-tree/SHA/date/OCI-label/digest checks, image build, health/assets/config/secrets/non-root/persistence mount | Runtime path/config, asset serving, data volume, provider connectivity changes | Always before production release; deploy remains owner-approved |
| `ANALYTICS` | No V2 module may change; reserved classification for a post-V2 project only | All V2 application, website, quiz, result, commerce, email, localization, and infrastructure modules | Not applicable during V2; stop and defer the request | Not applicable during V2 | Not applicable during V2; analytics implementation requires a new post-V2 scope after V2 release |

## Change-type details

### Answer wording versus evidence

**RECOMMENDATION:** A customer-facing answer text edit starts as `CONTENT_ONLY`, but earns that classification only after the meaning-preservation gate in `PROTECTED_CONTRACTS.md` passes. Changed meaning, evidence rationale/vector, IDs, scenario domain, designed pair, or selector/stopping relevance makes it `QUIZ_EVIDENCE`.

**OBSERVATION:** Text and evidence currently coexist in the same option objects, so a visual diff alone cannot prove impact. A later normalized schema/checksum must compare semantic fields separately. Confidence: high.

### Combined changes

Apply the union of requirements, with the highest-risk regression rule winning. Examples:

- result copy plus layout = `RESULT_CONTENT` + `RESULT_PRESENTATION`;
- new price plus checkout copy = `PRICING` + `WEB_UI` + `LOCALIZATION`;
- changed evidence vector plus scoring algorithm = `QUIZ_EVIDENCE` + `QUIZ_RUNTIME`, requiring all-quiz/full regression;
- checkout route payload plus Stripe adapter = `WEB_UI` + `PAYMENT`, requiring payment full regression.

### Analytics scope

**RECOMMENDATION:** `ANALYTICS` is not an implementable V2 change type. During V2, any request for an event schema, port, sink, adapter, GTM, GA4, consent implementation, provider, or analytics-related runtime code stops and is deferred. After V2 is completed and released, the owner may authorize a separate project with a new impact and privacy assessment.

## Cross-module and full-regression rules

Cross-module QA is mandatory when any of these changes:

- public schema/DTO, route, status/error code, module public API;
- persisted record/result/session shape or version resolver;
- content compiler output consumed by runtime/results;
- pricing result consumed by API/checkout/purchase snapshot;
- payment event consumed by purchase activation;
- purchase delivery request consumed by email;
- locale propagation or ResultViewModel consumed by UI.

Full regression is mandatory when any of these applies:

- a protected payment, purchase/access, token, data, or webhook contract changes;
- shared runtime scoring/selector/stopping logic changes;
- a shared schema change affects all quiz versions or stored compatibility;
- global router/shell/bootstrap/build/runtime environment changes across journeys;
- pricing/currency actually changes;
- an exact risk boundary cannot be proven through module/contract tests;
- release candidate is being proposed for production.

Payment QA is required for `PRICING`, `PAYMENT`, `PURCHASE_ACCESS` changes involving activation, and any `WEB_UI`/API change to checkout. It is not required for isolated quiz wording, authoring profile, result presentation, navigation, or informational-page changes.

## Impact declaration template

```text
Change:
Primary type:
Secondary types:
Owner module:
Allowed files/modules:
Explicitly untouched modules:
Protected contracts:
Targeted QA:
Cross-module QA:
Other-quiz regression: none / affected only / all
Payment QA: no / contract double / Stripe test mode
Full regression: no / yes, reason
Approval gate:
Stop condition if diff expands:
```

## Architecture fitness hypothesis

**HYPOTHESIS H-IMPACT-001:** Classification plus enforced dependencies will reduce median routine-change review scope without increasing escaped regressions.

- Supporting evidence: V1 pure modules have focused tests; the broadest review pressure comes from mixed-responsibility files.
- Contrary evidence: new boundaries can create contract overhead and false confidence if tests are weak.
- Confidence: medium.
- Assumptions: teams reclassify honestly, contract tests cover seams, and full regression remains available for uncertainty.
- Test method: for the first ten V2 maintenance changes, record planned/actual files, suites, review time, and escaped defects.
- Success: at least eight of ten routine changes stay within declared modules, with no protected-contract regression.
- Failure: more than two routine changes need unrelated-module edits or a protected regression escapes targeted QA.
- Status: PROPOSED.
