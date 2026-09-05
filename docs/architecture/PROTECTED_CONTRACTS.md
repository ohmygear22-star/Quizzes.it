# Protected V2 Contracts

Status: Phase 0 owner-review draft

Baseline evidence: local repository at `9be4a639bd7d44a8db79d12c5b804ed5a4cdcc07`, inspected 2026-09-05

Scope: contracts to preserve through modular migration; this document does not authorize behavior changes

## Contract policy

**RECOMMENDATION:** A protected contract may be changed only by an explicit later owner-approved migration that names the contract, compatibility behavior, data impact, rollback, and QA. Refactoring behind a contract is permitted only when externally observable behavior and stored-data readability remain unchanged.

**RECOMMENDATION:** Contract tests should capture current behavior before extraction. If baseline code and prose disagree, stop and record the discrepancy; do not silently choose a new behavior.

## P1. Server-authoritative checkout and price

**FACT:** `POST /api/checkout` accepts email, quiz slug, and offer ID; the server finds the live product, verifies the saved preview session, resolves the offer, constructs Stripe price data, and stores an offer snapshot. `v31/production-adapter.js` currently projects one `v31-paid` offer at `2900` minor units in `hkd`.

Protected behavior:

- current global customer price remains HK$29 / 2900 HKD;
- the browser is not an authority for amount, currency, paid status, or access;
- checkout is available only for a live, resolvable quiz/offer after a valid matching preview;
- amount uses integer minor units and currency remains `hkd`;
- pending purchase is linked to the Stripe Checkout Session and retains the resolved offer snapshot;
- success/cancel routes remain compatible.

**RECOMMENDATION:** V2 centralizes the current price in `PricingPolicy`. Both public display DTOs and checkout resolve from it, but checkout independently validates the current offer server-side.

## P2. Stripe webhook verification and paid events

**FACT:** V1 verifies Stripe's `v1` HMAC-SHA256 signature using the exact raw request body, `STRIPE_WEBHOOK_SECRET`, timing-safe comparison, and a 300-second timestamp tolerance. It recognizes paid `checkout.session.completed` and `checkout.session.async_payment_succeeded` events only when `payment_status === "paid"`.

Protected behavior:

- webhook verification occurs before JSON event handling or state mutation;
- raw bytes—not reserialized JSON—are signed;
- invalid, missing, or stale signatures return an error and cannot activate access;
- only supported paid events with paid payment status enter purchase activation;
- checkout session/purchase linkage is validated;
- repeated paid events are idempotent and do not create a new access token or duplicate a sent email.

## P3. Purchase persistence and compatibility

**FACT:** V1 stores `{ purchases, previewSessions }` in `/data/purchases.json` through write-to-temporary-file then rename. Purchase fields observed include identity/email/status/timestamps, Stripe session, quiz/version/offer and offer snapshot, preview/completed answers, locale, hashed/encrypted token material, adaptive state, stored result, retake count, and email delivery state.

Protected behavior:

- all existing production purchase records remain readable;
- unknown extra fields are tolerated and preserved when practical;
- missing legacy quiz ID/version continues through a documented compatibility resolver equivalent to the current default-quiz fallback;
- pending purchases expire after the current 24-hour window; paid access expires at its stored expiry;
- paid activation is persisted before email delivery;
- completed answers/session/result and retake count remain associated with the same purchase;
- a missing historical quiz version yields an explicit unavailable response, never substitution with a semantically different version;
- migration never rewrites production records destructively in place without a separately approved, backed-up data plan.

**RECOMMENDATION:** Introduce a version-tolerant `PurchaseRepository` port and characterization fixtures before changing storage technology. Start V2 with a compatibility adapter over the current JSON shape.

## P4. Private access and token lifecycle

**FACT:** Paid activation creates a 32-byte random base64url token, stores its SHA-256 hash for lookup, encrypts a recoverable copy with AES-256-GCM using purchase ID as additional authenticated data, and sets expiry to seven days. Public access uses the raw token in `/access/{token}` and `/api/access/{token}...` paths.

Protected behavior:

- one personal link unlocks one purchased quiz version for seven days;
- no account is required;
- only a paid, unexpired purchase grants access;
- plaintext tokens are not stored in the purchase record;
- retrying email recovers the same token, does not rotate it, and does not extend access;
- token and email are never returned in catalogue/analytics/result payloads;
- retakes remain available during the active access period and stay tied to the purchased quiz.

## P5. Preview and continuation

**FACT:** The current adaptive flow requires exactly five preview answers, stores a hashed preview token in a secure cookie-backed session for 24 hours, and checks that non-retake paid answers begin with the purchased preview answers.

Protected behavior:

- five-question preview remains the current public gate;
- the preview token cookie remains `HttpOnly`, `Secure`, `SameSite=Lax`, path `/`, with the current 24-hour lifetime unless separately approved;
- checkout requires a matching quiz ID/version preview session;
- paid continuation resumes the saved preview/adaptive state;
- a non-retake cannot replace the preview answer prefix;
- a retake may start fresh without changing purchase/access expiry.

## P6. Email lifecycle

**FACT:** After payment activation V1 records email state (`pending`, `sent`, or `failed`), attempts delivery through Resend, stores the provider message ID on success, and retains encrypted token material to retry a failed delivery. In-process dispatches are deduplicated by purchase ID.

Protected behavior:

- access email is triggered only after verified paid activation is committed;
- email goes to the checkout email and contains the personal access link for the purchased quiz;
- EN and zh-Hant copy follow the purchase locale;
- provider failure leaves the purchase paid and retryable;
- retries are idempotent, use the same token, and increment/record delivery state without granting new access;
- an already-sent email is not resent by a repeated webhook/retry request;
- current seven-day/no-account/private-access promise remains accurate.

## P7. Deterministic quiz runtime

**FACT:** `v31/engine.js` validates question order and duplicate answers, applies evidence through `scoring.js`, chooses paid questions through `selector.js`, and evaluates stop conditions through `stopping.js`. Tie-breaks and candidate ordering are explicit. No live LLM participates.

Protected behavior:

- the same immutable quiz version and ordered valid answers produce the same scores, selection trace, stopping outcome, primary/secondary ranking, and completion reason;
- answer order, question/option IDs, duplicate rejection, tie-break behavior, and paid-unlock gate remain deterministic;
- scoring, selector, and stopping behavior do not depend on locale wording, current time, provider calls, or UI state;
- no live LLM-generated question, answer, evidence, selection, score, or result is introduced;
- content/evidence/runtime versions required for replay are recorded or resolvable.

## P8. Deterministic result generation

**FACT:** `v31/result-builder.js` derives evidence moments, confidence, eight phases, Truth Packet, result-value sections, and personality perspectives from the completed state and versioned source content. V1 persists `v31Result` after completion.

Protected behavior:

- an incomplete session cannot produce a final result;
- the same quiz/content/runtime versions, answers, outcome, and locale produce the same result data;
- actual evidence and counter-evidence remain traceable to selected question/option IDs;
- result safety language remains non-clinical and non-diagnostic;
- stored historical results remain renderable or receive an explicit legacy renderer/compatibility path;
- changing result presentation alone cannot alter scores, evidence, confidence, or Truth Packet.

**RECOMMENDATION:** New V2 results explicitly version `ResultTruth` and `ResultViewModel`; existing `v31Result` remains supported without destructive conversion.

## P9. Quiz identity and version compatibility

**FACT:** Eleven V3.1 quizzes are registered by stable REL IDs. Public slugs currently derive from lower-cased IDs, and purchase resolution uses quiz ID plus exact version.

Protected behavior:

- IDs and purchased versions are immutable identifiers;
- a newly active version does not change the meaning of an old purchase;
- registry publication changes do not delete historical resolvability;
- duplicate IDs/slugs are rejected;
- adding a quiz does not mutate unrelated quiz content or runtime logic.

## P10. Localization

**FACT:** Supported customer locales are English and Traditional Chinese (`en`, `zh-Hant`); locale normalization maps common Chinese variants to `zh-Hant` and English variants to `en`. Quiz questions/options/result content, catalogue metadata, UI, and access email have bilingual behavior, though V1 ownership is distributed.

Protected behavior:

- `en` and `zh-Hant` remain available throughout the customer journey;
- saved purchase locale governs private continuation/result/email behavior;
- locale changes do not alter option IDs, evidence, scoring, selector, or stopping;
- missing/invalid locale falls back compatibly to English;
- Traditional Chinese remains appropriate natural written language for the Hong Kong audience;
- customer-visible additions require both locales or an explicit owner-approved fallback.

## P11. Customer routes and API compatibility

**FACT:** The V1 single-page shell serves non-API GET routes and uses hash routes. Observed customer routes include home, `#catalog`, `#quiz/{slug}`, `#preview/{slug}`, `#checkout/{slug}`, `#how`, `#support`, `#privacy`, `#terms`, `/payment-success`, `/payment-cancelled`, and `/access/{token}`. Observed APIs include `GET /health`, `GET /api/quizzes`, `GET /api/quizzes/{slug}`, GET/POST preview, POST checkout/webhook, and GET/POST access/next/result routes.

Protected behavior:

- existing bookmarked and emailed customer routes continue to resolve;
- access links keep their path form and token semantics;
- current API behaviors remain compatible while handlers move behind adapters;
- public errors do not disclose secrets/provider details;
- root public access is validated with `GET`, not inferred from `HEAD` behavior.

**RECOMMENDATION:** Route changes require an explicit redirect/compatibility table and contract tests. Internal handler extraction alone must not change URLs.

## P12. Privacy, data, and analytics boundary

**FACT:** Current product promises private email-bound access, temporary answers/results, and no permanent quiz-history account. V1 emits browser `quiz-flow` custom events. V2 does not add, replace, or route these through new analytics runtime architecture.

Protected behavior:

- production customer data is not modified by architecture work;
- Analytics remains an architecture responsibility label only during V2;
- V2 adds no analytics event schema, port, sink, adapter, provider, consent implementation, or analytics-related runtime code;
- no GTM or GA4 is added in Phase 0 or any V2 migration/release phase;
- analytics implementation begins only as a separately scoped project after V2 is completed and released;
- any later analytics design must keep email, access tokens, raw answers, scores, and result truth out of analytics payloads and must not become a precondition for quiz, payment, access, or email success.

## P13. Security and operational configuration

Protected behavior:

- secrets remain environment/configuration inputs and never enter source, client bundles, logs, image labels, or release records;
- preview authorization, security response headers, request limits, webhook raw-body handling, and token cryptography remain covered by characterization/security tests;
- provider calls occur only in server adapters;
- production deployment, pricing changes, payment changes, spending, and destructive actions require explicit owner approval.

## P14. Release provenance

**FACT:** The current `Dockerfile.secure` copies the secure server, `public`, and `v31` tree but does not embed OCI revision/created labels. This is a V2 design requirement, not a V1 retrofit.

Protected V2 release contract:

- clean authoritative Git worktree before build;
- exact Git SHA and UTC build date recorded;
- image label `org.opencontainers.image.revision` equals that SHA;
- image label `org.opencontainers.image.created` equals the recorded build date;
- exact image digest tested and then deployed without rebuild;
- release record maps the running digest back to source and retains rollback digest;
- post-deploy verification compares running image identity to the release record.

## Meaning-preservation gate for wording-only answers

**RECOMMENDATION:** `CONTENT_ONLY` answer edits pass only if all are true:

1. option and question IDs are unchanged;
2. evidence vectors and evidence rationales are unchanged;
3. scenario domain, designed pair, information value, and stopping configuration are unchanged;
4. an EN reviewer and a zh-Hant reviewer compare old/new behavioral meaning in context;
5. every answer still directly and distinctly answers its question;
6. mapping/logic checksums match before and after;
7. deterministic replay samples produce byte-equivalent `ResultTruth` (localized view text may differ);
8. the reviewer records `meaning_preserved: true` with the compared content versions.

If any condition fails or meaning is debatable, reclassify as `QUIZ_EVIDENCE` and apply its broader QA.

## Contract change record

Any later proposed protected-contract change must record:

- contract ID above;
- change classification;
- current and proposed behavior;
- affected stored/API/customer versions;
- backward/forward compatibility and deprecation window;
- security/privacy/payment/data risks;
- targeted, cross-module, and full-regression tests;
- rollback/restore plan;
- owner approval reference and status.

**HYPOTHESIS H-CONTRACT-001:** Explicit compatibility tests around these contracts will let internals move without customer-visible change.

- Supporting evidence: V1 behavior is reachable through stable routes and deterministic modules.
- Contrary evidence: some current contracts are implicit in monolithic code and source-text tests.
- Confidence: medium-high.
- Assumptions: characterization captures edge cases and historical purchase fixtures are representative.
- Test method: old-client/API and stored-record fixtures against each migrated slice.
- Success: equivalent responses/state transitions for all protected scenarios.
- Failure: a migration needs silent data rewriting, changes a customer route, or produces different truth/payment/access behavior without approval.
- Status: PROPOSED.
