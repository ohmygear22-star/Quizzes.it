# Update Quiz SOP

Use for a change to an existing quiz product. This SOP is derived from the current multi-quiz registry and version-aware access implementation.

## Guardrails
- Complete PRODUCT_REVIEW for material content, price, result, scoring, or customer-flow changes.
- Preserve existing paid access: `quizzes/index.js` resolves `id@version` for stored purchases.
- Never overwrite historical quiz definitions or change an existing product version in place when past purchasers may need their original result.
- No deploy, price change, live Stripe action, destructive data action, or marketing action without explicit owner approval.

## Implement
1. Identify the quiz by its stable `id`, `slug`, and current `version`.
2. For a content/scoring/result change, retain the old module/version and add the next version; ensure the registry resolves both.
3. For presentation-only changes, keep quiz content and engine logic separate; route frontend work through website-architect.
4. Keep offer snapshots and access records compatible with `app-secure.js`; do not alter stored purchase data casually.

## Validate
Run the current commands:
```sh
node --check app-secure.js
node --check quiz-engine.js
node --check quizzes/index.js
node --check public/multi-quiz.js
node scripts/validate-quizzes.mjs
git diff --check
```
QA the unchanged quiz, the updated quiz, catalogue navigation, preview, checkout creation, webhook, email access, completion, result reload and expiry.

## Release
quiz-qa and website-qa provide regression evidence. RELEASE_REVIEW includes affected versions, migration/rollback plan, sandbox evidence, known limitations and explicit owner approval before deployment.
