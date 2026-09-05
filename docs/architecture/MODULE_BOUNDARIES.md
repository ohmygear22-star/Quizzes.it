# V2 Module Boundaries

Status: Phase 0 design

Evidence date: 2026-09-05

Source: local baseline repository at `9be4a639bd7d44a8db79d12c5b804ed5a4cdcc07`; no network retrieval

## Boundary standard

**RECOMMENDATION:** Every module has one owner, a narrow public API, explicitly allowed dependencies, forbidden knowledge, and focused tests. A caller imports only the module entry point or a shared versioned schema. A change that needs a forbidden dependency fails architecture review.

**RECOMMENDATION:** Target paths below describe later migration destinations. Phase 0 creates no target source directories.

## Module catalogue

| Module | Target namespace | Owns | May depend on | Must not know |
|---|---|---|---|---|
| Website/UI | `src/website` | Shell, pages, navigation, responsive/a11y presentation, client flow state | API DTOs, `ResultViewModel`, localization UI catalogue | Evidence weights, scoring, Stripe secrets, purchase storage, authoritative price, new analytics runtime code during V2 |
| Backend/API | `src/backend` | HTTP parsing, route registration, DTO/error mapping, composition | Application use cases, shared schemas, concrete adapters only in bootstrap | Domain implementation details in route handlers; DOM |
| Quiz Registry/Catalogue | `src/quiz/registry` | Quiz IDs, slugs, available versions, active/publication status, public metadata refs | Quiz contract identifiers/schemas | Questions, scores, payment provider, UI markup, authoritative pricing |
| Quiz Contracts | `src/quiz/contracts` | `QuizContract`, compiled quiz and version schemas | Shared schema primitives | UI, server, providers, concrete quiz content |
| Quiz Content | `src/quiz/content` | Versioned questions/options/wording/evidence/rationales/result source copy | Quiz contracts; authoring profile ID as data | HTTP, persistence, Stripe, DOM, mutable global price |
| Quiz Runtime | `src/quiz/runtime` | State transitions, scoring, selector, stopping, deterministic completion | Compiled quiz schema, shared pure utilities | Authoring style, UI copy, payments, persistence, locale wording |
| Quiz Results | `src/quiz/results` | Truth construction, view-model construction, result-content lookup | Runtime outcome schema, quiz content/contracts, localization | DOM layout, checkout, token lifecycle |
| Quiz Authoring | `src/quiz/authoring` | Versioned authoring profiles, validators, review artefacts | Quiz contract/content schemas | Customer runtime state, selector implementation, payments |
| Pricing Policy | `src/commerce/pricing` | Server-authoritative offer amounts/currency/effective version | Quiz identity, shared money schema | Questions, result content, DOM, Stripe API |
| Payments | `src/commerce/payments` | Checkout intent, Stripe mapping, webhook verification/event normalization | Pricing result, purchase use-case ports, shared schemas | Granting access directly, email templates, quiz runtime |
| Purchases/Access | `src/commerce/purchases` | Purchase state machine, repository port, legacy reads, tokens, expiry, retakes | Quiz version resolver port, crypto/clock ports, shared schemas | Stripe signature rules, DOM, question authorship, email provider |
| Email | `src/email` | Access email model/copy, delivery state/idempotency, delivery port | Purchase-approved delivery DTO, localization, shared schemas | Payment decision, token creation, quiz scoring, HTTP routes |
| Localization | `src/localization` | Supported locales, resolution, generic domain message catalogues | Shared primitives | DOM mutation, quiz evidence, payment state |
| Shared Schemas/Utilities | `src/shared` | Versioned DTO/value schemas, errors, dependency-free helpers | Nothing inward | Domain policy, environment access, providers, catch-all business helpers |
| Analytics boundary | Reserved responsibility only; no V2 runtime namespace | Future ownership label for a separately approved post-V2 project | Nothing during V2 | Event schemas, ports, sinks, adapters, GTM, GA4, consent implementation, or any analytics-related runtime code during V2 |

## Public contracts between modules

Names are conceptual V2 contracts; exact language syntax is selected during implementation planning.

| Producer | Contract | Consumers | Stability rule |
|---|---|---|---|
| Quiz Registry | `QuizReference`, `PublicQuizMetadata` | API, pricing, purchases | Additive changes preferred; ID+version resolution remains stable. |
| Quiz Contracts/Content | `CompiledQuizDefinition` | Runtime, results, validators | Immutable per content version; schema version is explicit. |
| Quiz Authoring | `AuthoringProfile` and validation report | Content author/reviewer tooling | Versioned independently from runtime. |
| Quiz Runtime | `RuntimeState`, `RuntimeOutcome` | API/application, result truth | Pure/deterministic; persisted form has a version and migration/reader. |
| Result Truth | `ResultTruth` | Result content/view-model builder, persistence | Immutable, evidence-based, no UI copy dependency. |
| Result content | `ResultViewModel` | Website result renderer, persistence policy | Versioned; presentation keys stable within a major schema. |
| Pricing | `ResolvedOffer` | API catalogue/detail, payment checkout | Server-generated; includes policy version and money minor units. |
| Payments | `VerifiedPaymentEvent` | Purchase activation use case | Only verified, normalized provider facts cross the boundary. |
| Purchases | `PurchaseAccess`, `AccessGrant`, `AccessDeliveryRequest` | API, runtime orchestration, email | Backward-compatible reader; secrets excluded from public DTOs. |
| Localization | `Locale`, translator/catalogue interface | All presentation/content modules | Supported locales remain `en`, `zh-Hant` unless explicitly approved. |

## Dependency rules

**RECOMMENDATION:** The permitted direction is:

```text
website ───────────────→ shared API/view schemas
backend routes ────────→ application use cases ──────→ domain public APIs
quiz authoring ────────→ quiz contracts/content schemas
quiz content ──────────→ quiz contracts
quiz runtime ──────────→ compiled quiz contract
result truth ──────────→ runtime outcome + compiled evidence
result view model ─────→ result truth + localized result content
payments ──────────────→ pricing + purchase activation port
purchases/access ──────→ registry resolver port + crypto/clock/repository ports
email ─────────────────→ approved delivery DTO + localization
provider adapters ─────→ ports owned by the modules above
all modules ───────────→ shared schemas/utilities (kept dependency-free)
```

Forbidden edges:

- `website` → runtime/content/payment/purchase internals;
- runtime → authoring/results/registry/UI/commerce;
- content → registry/commerce/UI;
- results → UI/payment/purchases;
- pricing → content/UI/provider;
- purchases → Stripe/Resend/DOM;
- email → payment activation or access authorization;
- shared → any domain module;
- any domain module → concrete file paths or process environment except through bootstrap/configuration.

## Quiz-specific boundaries

### Quiz Contract

Required fields:

- stable quiz ID and slug policy;
- content/contract/schema versions;
- localized title and customer promise;
- evidence hypotheses and their behavioral meanings;
- applicable relationship/life stages;
- result promise and non-clinical safety boundary;
- supported locales;
- allowed assessment configuration: preview count, length band or fixed length, stopping-policy reference;
- authoring-profile reference;
- compatibility declaration for stored sessions/results.

The contract excludes individual questions, current price, publication state, HTML, provider configuration, and analytics tags.

### Authoring Profile

Required fields:

- independent profile version and applicability;
- question voice/style and scenario-design rules;
- relationship-stage applicability rules;
- social and real-world scenario requirements;
- title-to-question relevance rules;
- curiosity progression;
- question-to-answer coherence rules;
- answer meaning distinctness;
- EN and Hong Kong natural written Traditional Chinese tone rules;
- originality and non-clinical safety checks.

The profile is used to author and validate. It does not implement score accumulation, adaptive selection, or stopping.

### Quiz Content

Every option separates:

```text
option identity
customer-facing EN wording
customer-facing zh-Hant wording
behavioral meaning / evidence rationale
evidence vector
question/scenario metadata
```

**RECOMMENDATION:** A wording-only revision must prove that the last three items and option identity are unchanged. If behavioral meaning cannot be shown equivalent, create a new content/evidence version and classify it `QUIZ_EVIDENCE`.

### Runtime and results

**RECOMMENDATION:** Runtime outputs identifiers and evidence facts, never localized prose. Result truth turns the completed runtime outcome into a stable evidence record. The view-model builder combines truth with versioned localized result content. The UI maps view-model keys to components without interpreting scores.

## Commerce and access transaction boundaries

**RECOMMENDATION:** The purchase application service coordinates the transaction:

```text
preview completion
  → checkout request
  → server resolves current offer
  → pending purchase + offer snapshot committed
  → Stripe checkout created and linked
  → raw webhook verified by Payments
  → normalized paid event passed to Purchases
  → idempotent paid transition + access token committed
  → Email receives delivery request
  → delivery state recorded; retry uses same access grant
```

Failure rules:

- failed/unverified webhook never activates a purchase;
- provider email failure never rolls back a paid purchase or creates a second token;
- repeated paid webhook is idempotent;
- email retries use the existing encrypted recoverable token and do not extend expiry;
- checkout/client inputs never set price or paid status;
- persistence succeeds before asynchronous email delivery begins.

## Website/UI boundary

**RECOMMENDATION:** Split the current browser monolith by customer flow, while preserving current routes. Generic shell/navigation uses route descriptors and localized message keys. Adding a page registers one page route and navigation entry only if desired. Quiz flow controllers consume quiz/access DTOs. Result components consume `ResultViewModel`. Checkout consumes `ResolvedOffer` display fields and submits only quiz/offer identity plus email.

Responsive/accessibility obligations owned by Website/UI:

- mobile, tablet, and desktop layouts;
- keyboard navigation and visible focus;
- semantic controls, landmarks, labels, status/live regions;
- minimum practical touch targets;
- menu focus/escape behavior and body-scroll management;
- bilingual layout expansion and correct document language;
- error/loading/expired-access states.

The Website/UI module does not validate Stripe signatures, infer payment completion, compute results, or read persistence.

## Localization boundary

**RECOMMENDATION:** Replace DOM text-walking/replacement patches with key-based rendering over structured catalogues. Separate generic shell, commerce, access/email, quiz content, and result-content catalogues by owner. Locale is carried explicitly in request/session/result contracts. Normalization remains deterministic and defaults compatibly to English.

**OBSERVATION:** V1's mixed inline strings and post-render translation patches make completeness and ownership difficult to prove. Moving to keyed catalogues should reduce presentation coupling, but bilingual copy still needs human QA. Confidence: high.

## Reserved analytics responsibility

**RECOMMENDATION:** Reserve the Analytics responsibility name in the architecture only. Do not create an analytics module, event schema, port, no-op sink, adapter, consent implementation, provider integration, or analytics-related runtime code during V2. After V2 is completed and released, a separately approved post-V2 project may define those responsibilities from fresh privacy, product, and measurement requirements.

## Enforcement tests for later phases

- import-boundary test rejects forbidden cross-module and deep imports;
- schema tests validate all public contracts and version fields;
- registry test proves unique IDs/slugs and resolvable historical versions;
- deterministic replay test hashes runtime outcomes for fixed inputs;
- result contract test proves UI projection cannot change truth;
- pricing test proves catalogue and checkout use the same resolved offer while the server remains authoritative;
- purchase compatibility fixtures cover current and legacy record shapes;
- browser tests prove routes, responsive shell, keyboard behavior, EN/zh-Hant, and result rendering;

## Boundary failure test

**HYPOTHESIS H-BOUND-001:** A module boundary is effective when a reviewer can understand a routine diff by reading the owning module contract, changed files, and focused tests without inspecting unrelated internals.

- Supporting evidence: existing pure scoring/selector/stopping modules already permit focused tests.
- Contrary evidence: current server and browser monoliths require source slicing and broad inspection.
- Confidence: medium-high.
- Assumptions: module public APIs remain narrow and schema changes are explicit.
- Test: run the acceptance-scenario worksheet against every proposed Phase 1+ task.
- Success: no forbidden edge and no unrelated shared file change.
- Failure: a routine change requires edits across unrelated domains or an unexplained full regression.
- Status: PROPOSED.
