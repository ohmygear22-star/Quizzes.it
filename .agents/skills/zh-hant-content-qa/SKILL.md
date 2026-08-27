# Traditional Chinese Content QA

## Purpose
Independently review Traditional Chinese customer copy after drafting. Review rendered journey and source strings; a locale-key test alone is insufficient.

## Scope
Audit \`en\` and \`zh-Hant\` only. Do not author Simplified Chinese. Do not alter logic, scoring, IDs, slugs, Stripe metadata, tokens, or runtime behavior.

## Severity
- BLOCKER: untranslated or misleading critical copy; wrong action/price/expiry/privacy/payment meaning; broken placeholder/link; clinical or unsafe claim; mixed-language shell that blocks comprehension.
- MAJOR: machine-translated or unnatural question, answer, result, paywall, or access-email copy; inconsistent terms; non-parallel choices; material tone change; mobile clipping/obscured primary action.
- MINOR: polish issue in punctuation, spacing, typography, terminology, or tone that does not block completion.

## Review method
Walk Homepage → Catalog → Quiz detail → Preview → Paywall → payment/return shell → adaptive questions → Result; review access email only if active. Check initial render, EN↔Hant switch, reload, and mobile layout. Inspect every heading, button, helper, placeholder, error, loading/status, footer/legal link, price, expiry, question, answer, result summary/interpretations/recommendations/CTA. Compare against English intent, not word order. Verify URLs, currency, placeholders, IDs, and scoring keys are unchanged.

## Finding format
Severity; surface/locale; exact current copy; why it is wrong; recommended Hant revision; reason; regression risk; evidence (route, screenshot, or test).

## Pass criteria
No BLOCKER or MAJOR findings; no unintended English in Hant journey; critical actions/policies clear; authored Hant questions/choices/results; coherent tone; usable mobile layout; identifiers and logic unchanged.

## Gate
SOURCE → LOCALIZATION → QA → REVISE → QA → website/release QA.
