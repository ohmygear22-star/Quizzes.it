# V2 Architecture Acceptance Scenarios

Status: Phase 0 architecture tests

Evidence date: 2026-09-05

Baseline source: local repository at `9be4a639bd7d44a8db79d12c5b804ed5a4cdcc07`; V1 surfaces are likely-impact estimates confirmed from current imports/content, not executed changes

## Acceptance rule

**RECOMMENDATION:** Before approving a V2 implementation boundary, walk the proposed request through the matching scenario. The architecture fails when a routine operation still requires edits to large unrelated shared files, broad inspection of unrelated domains, or full regression without a protected-contract/risk reason. Fix the boundary before implementing the feature.

“No regression” below means no behavioral regression of other quizzes beyond shared schema/registry smoke. It never means skipping validation of a changed shared contract.

## 1. Add one new quiz set

Primary types: `QUIZ_CONTRACT`, `CONTENT_ONLY`, and possibly `QUIZ_EVIDENCE`; registry publication is part of product review/release.

| Requirement | V1 likely surface | Proposed V2 surface |
|---|---|---|
| Change surface | Add source data to one of the source packs or a new pack; update `v31/source.js` if shape differs; add `v31/quizzes/<id>.js`; import/list in `v31/index.js`; configure `v31/publication.js`; update expected counts/fixtures/tests. Public product price is projected by the shared adapter. | Add one immutable `quiz/content/<id>/<version>` package containing contract/content/result content; reference an existing AuthoringProfile/runtime policy; add one registry entry/publication record. No shared runtime edit when existing schemas/policies suffice. |
| Expected files/modules | Current source JSON, source normalizer if needed, thin quiz module, registry/publication, validations/fixtures. | New quiz contract/content/result files, registry/publication entry, quiz-specific tests/fixtures. |
| Explicitly unchanged | Stripe, purchase/access, email, generic UI, existing quiz content, runtime algorithms unless the new quiz truly needs a new approved contract. | Runtime algorithms, result presentation, website shell/pages, pricing policy, payments, purchases/access, email, localization engine, every other quiz package. |
| Targeted QA | Source validation, bilingual completeness, 4 hypotheses/options, IDs, evidence, stopping, result blueprints/personas, catalogue/detail/preview/result checks. | Contract/content/authoring-profile QA, originality/safety, meaning/evidence validation, deterministic persona simulations, registry/API projection, EN/zh-Hant customer flow for the new quiz. |
| Other quizzes | V1 shared source/registry/adapter edits justify at least all-quiz registry/runtime smoke; source-normalizer edits broaden this. | No behavioral regression when only a new package/entry is added; run registry uniqueness and shared schema smoke across all quizzes. |
| Payment QA | Catalogue/offer/checkout contract smoke; test-mode checkout if publishing for sale. | Required before release because the new sellable quiz must resolve the central offer and purchase snapshot; existing quizzes need only pricing/checkout contract smoke. |
| Full regression | Likely before production because shared registry/source/adapter files change. | Not for draft package validation; required at RELEASE_REVIEW for publication/deployment, or if shared contracts/runtime change. |

Acceptance: adding the quiz must not edit existing quiz packages, runtime algorithms, result UI, purchase/email code, or price policy.

## 2. Update one existing quiz

Primary type depends on the change; it must not remain an undifferentiated “quiz update.”

| Requirement | V1 likely surface | Proposed V2 surface |
|---|---|---|
| Change surface | Edit shared source JSON/table data and potentially presentation cleanup, result builder expectations, frozen fixtures, and source/QA tests. Shared packs make one-quiz review noisy. | Create a new immutable content/contract version under only that quiz. Classify each edit as `CONTENT_ONLY`, `QUIZ_CONTRACT`, `QUIZ_EVIDENCE`, `RESULT_CONTENT`, or quiz-level configuration. Update that quiz's registry active-version pointer after product/release approval. |
| Expected files/modules | Relevant rows in `v31/source/*.json`, possibly `v31/presentation-copy.js`, registry/publication, affected tests/fixture. | One quiz package/version, its tests/fixtures, and one registry pointer; shared schema only if the contract genuinely changes. |
| Explicitly unchanged | Other quiz rows should be untouched but coexist in the same files; commerce/UI/runtime should remain unchanged unless evidence/runtime semantics require it. | Every other quiz package, generic UI, central pricing, payment, purchase/access, email, shared runtime for content/evidence-only work. |
| Targeted QA | Diff relevant rows, validate source, affected quiz simulations/result/copy in both locales. | Classification-specific suite; affected quiz contract/content validation; deterministic simulations; bilingual preview/result; historical-version resolution. |
| Other quizzes | Shared pack/normalizer changes require registry/schema smoke; algorithm edits require all quizzes. | None for isolated version content/evidence; schema smoke only. All-quiz only if shared runtime/schema changes. |
| Payment QA | No for wording/evidence/result changes; checkout smoke only if product/offer metadata changes. | No unless sellability, offer, checkout DTO, or purchase-version resolution changes. |
| Full regression | Often prudent in V1 due shared files/implicit adapter coupling. | No for bounded content/result changes; yes only under `CHANGE_IMPACT_MAP.md` triggers. |

Acceptance: “update quiz” cannot bypass classification, versioning, meaning-preservation, or historical-purchase compatibility.

## 3. Update all quizzes' result-page UI and result-content design

Primary types: `RESULT_PRESENTATION` + `RESULT_CONTENT`. Result truth remains protected.

| Requirement | V1 likely surface | Proposed V2 surface |
|---|---|---|
| Change surface | `v31/result-builder.js`, `v31/result-personalities.js`, result blueprint rows in source packs, `public/multi-quiz.js`, embedded styles in `public/index.html`, localization patches, and many result tests. | Shared result-content/view-model templates plus localized result content as needed, and shared result UI components/styles. `ResultTruth` adapter/contract stays byte-equivalent. |
| Expected files/modules | Result builder/content/source, browser renderer/styles, result/localization tests. | `quiz/results/content`, `website/results`, their EN/zh-Hant catalogues and fixtures/component tests. |
| Explicitly unchanged | Scoring/selector/stopping should remain unchanged but current builder adjacency invites inspection; Stripe/purchases/email should remain unchanged. | `quiz/runtime`, evidence mappings, `ResultTruth`, quiz questions, registry, pricing, payments, purchases/access, email. |
| Targeted QA | All result builder/value/truth/personality/UI tests; all quiz/persona outputs; legacy results; EN/zh-Hant desktop/mobile. | Truth hash unchanged; all-quiz truth→view-model content fixtures; current/legacy ResultViewModel rendering; responsive/a11y/locale/safety QA. |
| Other quizzes | Yes: request intentionally affects every quiz's result experience. | Yes for result content/presentation only; no quiz-runtime behavioral regression beyond unchanged truth-contract proof. |
| Payment QA | No, unless result access routing/purchase retrieval is altered. | No; access contract smoke is sufficient if renderer wiring changes. |
| Full regression | Likely because monolithic browser and result builder change. | Full result/browser regression; full product regression only if global router/access schema changes. |

Acceptance: no scoring, selector, stopping, or evidence file changes are allowed for presentation/content design alone.

## 4. Add a new website page

Primary type: `WEB_UI`; add `LOCALIZATION` for customer copy.

| Requirement | V1 likely surface | Proposed V2 surface |
|---|---|---|
| Change surface | Add a route/render function and copy to `public/multi-quiz.js`; add styles to `public/index.html`; possibly update translation mutation maps and source-text navigation tests. | Add one page module/component, localized message keys, one route-table entry, and optionally a navigation descriptor if linked globally. |
| Expected files/modules | Browser monolith, HTML styles, localization patches/tests. | `website/pages/<page>`, route table, page catalogue, focused component/browser tests. |
| Explicitly unchanged | Quiz runtime/content, backend API, Stripe, purchases/access, email should remain untouched. | Quiz registry/contracts/content/runtime/results, pricing, payments, purchases/access, email, backend except when the page intentionally needs a new approved API. |
| Targeted QA | Route render, both locales, mobile/desktop, navigation/back behavior, a11y, existing route smoke. | Page component/route/locale tests, responsive/keyboard/a11y, shell route smoke. |
| Other quizzes | No behavioral regression; current monolith may justify preview/access smoke. | No. |
| Payment QA | No unless page is checkout/payment status. | No. |
| Full regression | Often global browser smoke because the monolithic router changes. | No; shell/router contract smoke only. Full browser regression only if shared router semantics change. |

Acceptance: no quiz/runtime/result/commerce code is read or edited for a static/informational page.

## 5. Update the menu bar

Primary type: `WEB_UI` + possibly `LOCALIZATION`.

| Requirement | V1 likely surface | Proposed V2 surface |
|---|---|---|
| Change surface | Header markup/styles in `public/index.html`, menu route handlers and locale labels in `public/multi-quiz.js`, several source-text/browser tests. | Shell navigation component, route descriptors, shell message catalogue, shell component/browser tests. |
| Expected files/modules | Both browser monolith files and navigation/localization tests. | `website/shell/navigation`, shell styles/catalogue/tests. |
| Explicitly unchanged | Catalogue data, quiz content/runtime/results, backend, payments/access/email. | Pages' internals, quiz modules, result modules, pricing/payment/purchase/email. |
| Targeted QA | Desktop/mobile menus, language switch, current links, escape/outside click, focus, touch targets, both locales. | Navigation component/route-link tests, desktop/mobile/tablet, keyboard/focus/escape/body-scroll, EN/zh-Hant, all route-link smoke. |
| Other quizzes | No runtime regression; smoke routes into catalogue/one quiz/access. | No. |
| Payment QA | No. | No. |
| Full regression | Browser-shell regression likely because shared monolith changes. | Shell/browser regression only; not full runtime/commerce. |

Acceptance: menu changes never touch quiz content, price, checkout, access, or result truth.

## 6. Update all quizzes' question authoring logic

Primary type: `AUTHORING_PROFILE`. This is not `QUIZ_RUNTIME` unless selection/stopping execution changes.

| Requirement | V1 likely surface | Proposed V2 surface |
|---|---|---|
| Change surface | No single explicit versioned authoring-profile module exists. Rules are distributed across source pack metadata, QA scripts, agent skills/instructions, and authored rows. Changing rules risks being conflated with changing published content or selector logic. | Add a new immutable AuthoringProfile version and its validator examples/tests. Existing published quiz versions remain unchanged. Future drafts opt into the new profile; migrating content is separate per-quiz work. |
| Expected files/modules | Skills/docs/scripts and potentially large source-data rewrites if applied immediately. | `quiz/authoring/profiles/<version>` and authoring validator/tests only. Registry/contract references change only for new drafts or separately approved migrations. |
| Explicitly unchanged | Runtime scoring/selector/stopping must remain unchanged; current published questions should not change merely because rules changed. | All published content versions, runtime/selector/stopping, result truth/UI, registry publication, commerce, website, email. |
| Targeted QA | Rule/QA-script examples, current source compatibility analysis. If content regenerated, treat as separate content/evidence changes. | Profile schema; question style, scenarios, stages, title relevance, curiosity, Q→A coherence, bilingual tone, originality/safety positive/negative examples. |
| Other quizzes | No runtime regression for rules-only; all affected drafts validated. | No published-quiz regression. Future/migrated drafts validate against the new profile. |
| Payment QA | No. | No. |
| Full regression | No for documentation/rule validators; yes only if published content or runtime is also changed. | No. |

Acceptance: authoring profile code cannot import or modify adaptive selection/stopping logic; updating rules does not silently rewrite published quizzes.

## 7A. Update all quizzes' answer wording only

Primary type: `CONTENT_ONLY`, contingent on meaning preservation.

| Requirement | V1 likely surface | Proposed V2 surface |
|---|---|---|
| Change surface | Answer text is colocated with evidence in large shared source JSON/tables; `v31/presentation-copy.js` may mutate wording; broad diffs and content/result tests are likely. | Localized wording fields in each affected immutable content revision; no evidence, rationale, option ID, scenario, designed-pair, or runtime changes. A batch may contain one bounded change per quiz for reviewability. |
| Expected files/modules | Shared source packs, presentation cleanup, content tests/fixtures. | Affected quiz content wording plus meaning-review records/content tests. |
| Explicitly unchanged | Evidence weights/rationales, scoring, selector, stopping, result interpretation, price/payment/access/email, generic UI. | Same, plus QuizContract and ResultTruth schemas. |
| Targeted QA | Bilingual copy, Q→A coherence, uniqueness, exact evidence diff/checksum, affected result replay. | Full meaning-preservation gate: side-by-side EN/zh-Hant review, unchanged semantic fields/checksum, Q→A coherence, deterministic `ResultTruth` replay. |
| Other quizzes | Request affects all quiz copy, but not runtime logic; run all-quiz content validation/truth parity. | All quizzes receive content QA by intent; no runtime algorithm regression beyond all-quiz truth parity. |
| Payment QA | No. | No. |
| Full regression | Content/result/browser regression may be broad due shared packs and renderer/localization patches. | No full product regression if meaning gate and truth parity pass; bilingual preview/result browser sampling across all changed quizzes is required. |

Acceptance: if any reviewer cannot affirm equivalent behavioral meaning, that option/quiz moves to 7B and cannot ship under `CONTENT_ONLY`.

## 7B. Update all quizzes' answer evidence/scoring logic

Primary types: `QUIZ_EVIDENCE` and, if score calculation changes, `QUIZ_RUNTIME`.

| Requirement | V1 likely surface | Proposed V2 surface |
|---|---|---|
| Change surface | Evidence vectors/rationales in shared source packs; frozen logic; scoring, selector, stopping, engine, result-builder interpretations and broad tests may all be affected. | New evidence/content version per quiz; evidence-model/contract version; scoring module only if the shared accumulation/ranking algorithm changes; result truth/content interpretation reviewed explicitly. |
| Expected files/modules | Source JSON, runtime modules as relevant, fixtures/simulations, result builder/content/tests. | Affected quiz evidence packages/contracts, runtime only when algorithm changes, truth/result interpretation, compatibility/version fixtures. |
| Explicitly unchanged | Website shell/pages, pricing, Stripe, purchase/token/email; UI presentation unless ResultViewModel contract changes. | Same; authoring profile unchanged unless authoring rules also change. |
| Targeted QA | Evidence distribution, ranking, selector/stopping paths, completion, truth/evidence moments, result interpretation, personas, bilingual semantic review. | Evidence schema/rationales, simulations and score distribution, selector coverage, stop-length distribution, truth provenance, counter-evidence/confidence/result safety, historical version replay. |
| Other quizzes | Yes; shared source/runtime/result coupling requires all-quiz regression. | All quizzes intentionally change. All-quiz deterministic runtime/result regression is mandatory. |
| Payment QA | No unless access/session version contract changes; access-to-runtime integration still required. | No Stripe flow; purchase/access compatibility integration is required if persisted runtime/result version changes. |
| Full regression | Yes. | Yes because all quiz evidence/scoring semantics change; payment provider QA is not automatically part of it unless the commerce/access seam changes. |

Acceptance: the plan must quantify changed score/selection/stopping/result outcomes; a wording-only label is prohibited.

## 8. Change one quiz's length (for example 10 → 20 questions)

Primary type: `QUIZ_CONTRACT` plus quiz configuration/content; `QUIZ_RUNTIME` only if the shared engine cannot already express the policy.

| Requirement | V1 likely surface | Proposed V2 surface |
|---|---|---|
| Change surface | Change source question rows and stopping configuration; update source fixtures/counts, adapter duration/question-range copy, simulations, stopping/continuation/result tests. Shared metadata calculation may be touched. | New version of that quiz's contract/config/content, its additional questions/evidence/result coverage, registry active-version pointer, and derived metadata projection. Reuse an existing runtime stopping policy if possible. |
| Expected files/modules | Shared source pack, frozen logic/count tests, possibly shared adapter, affected runtime/result tests. | One quiz contract/content version and tests; registry pointer. Add a generic runtime policy only if no existing policy models the approved length. |
| Explicitly unchanged | Other quizzes' content/stopping, generic UI, pricing/payment/purchase/email; shared runtime algorithm when configuration is sufficient. | Other quiz packages, result UI, website shell, pricing/payment/access/email, runtime algorithms under the preferred config-only path. |
| Targeted QA | Question/stage counts, preview remains five, selector exhaustion, min/max stopping, duration/range display, affected persona/result/retake flow. | Contract/config schema, sufficient candidate coverage for designed pairs/domains, stop distribution, deterministic personas, catalogue metadata, preview/paid continuation/result/retake in both locales. |
| Other quizzes | Shared adapter/runtime changes require smoke or all-quiz regression. | None for config-only; registry/schema smoke. All-quiz if shared stopping/runtime code changes. |
| Payment QA | No Stripe QA; checkout/purchase must snapshot correct quiz version and continuation must resolve it. | Access/version integration required; no payment provider QA unless checkout DTO/version linkage changes. |
| Full regression | Likely if shared adapter/runtime touched. | No for config-only; yes if shared runtime/stopping algorithm changes. |

Acceptance: a one-quiz length change must not require editing all quizzes or adding title-specific logic to the shared runtime/UI.

## 9. Change the price of all quizzes

Primary type: `PRICING`; customer copy may add `WEB_UI`/`LOCALIZATION`. Requires explicit owner approval in a later phase.

| Requirement | V1 likely surface | Proposed V2 surface |
|---|---|---|
| Change surface | Change `2900` in `v31/production-adapter.js`, `priceHKD` source metadata, literal HK$29/HK$29.00 strings and translation maps in `public/multi-quiz.js`, related tests; verify Stripe request and snapshots. | Change one central PricingPolicy value/effective version. Website renders API money fields; only generic wording tests/catalogues change if they contain non-data price prose. No quiz package edit. |
| Expected files/modules | Adapter, source pack logic contract, UI/localization literals, pricing/product/checkout tests. | `commerce/pricing` policy/config/tests; generated/resolved offer contract fixtures; possibly generic UI locale tests. |
| Explicitly unchanged | Questions/evidence/runtime/results and email/access behavior should remain unchanged. | Every quiz contract/content/result, runtime, result UI structure, payment signature logic, purchase/token/email. Payment adapter consumes the new resolved amount without logic change. |
| Targeted QA | Catalogue/detail/paywall amounts, Stripe checkout amount/currency, client tampering rejection, purchase offer snapshot, current/old purchase behavior, both locales. | Policy/effective-date/money tests; API display parity; server checkout re-resolution; Stripe test mode; offer snapshot; old purchases remain unchanged; all customer price displays in EN/zh-Hant. |
| Other quizzes | Yes for all product projections because price is shared by adapter but literals can drift. | All registry products receive the same resolved policy through one test; no quiz runtime/content regression. |
| Payment QA | Required. | Required, including Stripe test mode and webhook→purchase/access/email integration. |
| Full regression | Required before price release. | Required before price release because money/payment is protected, but quiz runtime deep regression can be satisfied by stable contract smoke if unchanged. |

Acceptance: no per-quiz price edits; the charged amount and every displayed amount must derive from the same server-authoritative policy, while historical snapshots remain immutable.

## Scenario verdict matrix

| Scenario | Other-quiz behavioral regression in V2 | Payment QA | Full regression |
|---|---:|---:|---:|
| 1. Add quiz | No; shared registry/schema smoke | Yes before sellable release | Release/shared-contract only |
| 2. Update quiz | No for isolated version; classification dependent | Usually no | Classification dependent |
| 3. All result design | Result layer across all; runtime truth parity only | No | Result/browser; product only if shared flow changes |
| 4. Add page | No | No | No; router smoke |
| 5. Menu | No | No | Shell/browser only |
| 6. Authoring rules | No published quiz regression | No | No |
| 7A. Answer wording | All content QA by intent; truth parity | No | No if gate passes |
| 7B. Evidence/scoring | Yes, mandatory all-quiz | Access integration as relevant, not Stripe by default | Yes |
| 8. One quiz length | No if config-only | Access/version integration, not Stripe by default | Only if shared runtime changes |
| 9. Global price | No runtime regression; all product price projections | Yes | Yes |

## Acceptance hypothesis

**HYPOTHESIS H-ACCEPT-001:** The proposed V2 boundaries pass these routine operations with a smaller and more explainable surface than V1.

- Supporting evidence: ownership can be assigned to one module for pages, menu, authoring, pricing, runtime, and result presentation.
- Contrary evidence: actual migration may expose hidden API/persistence coupling not visible from static inspection.
- Confidence: medium-high.
- Assumptions: compatibility adapters and versioned schemas exist before module switches.
- Test method: require this document's worksheet in each corresponding change proposal and compare planned versus actual diff/test surface.
- Success: explicit non-affected modules stay unchanged, and broad regression occurs only at named risk seams.
- Failure: any routine scenario repeatedly edits unrelated shared files or requires unexplained repo-wide review.
- Status: PROPOSED.
