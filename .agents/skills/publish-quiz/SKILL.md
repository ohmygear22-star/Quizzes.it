# Publish Quiz SOP

Use for a new approved quiz product. This SOP is derived from the current Droplet implementation.

## Inputs and gates
- Record FACT, OBSERVATION, HYPOTHESIS and RECOMMENDATION; dynamic commercial decisions require current evidence.
- Complete IDEA_REVIEW and PRODUCT_REVIEW before implementation.
- Do not copy competitor questions, results, wording, or paid content.
- Do not deploy, publish, change price, send paid marketing, or enable live Stripe without explicit owner approval at RELEASE_REVIEW.

## Implement
1. Add a new product module at `quizzes/<slug>.js` with a stable lowercase `id`, `slug`, positive `version`, `status`, metadata, offers, questions, scoring, results, branching, preview and SEO fields.
2. Register it in `quizzes/index.js`; do not replace an existing product module.
3. Keep shared evaluation in `quiz-engine.js`; keep product-specific content in its module.
4. Use the public catalogue/detail routes already served by `app-secure.js` and rendered by `public/multi-quiz.js`. Do not invent a separate route schema.

## Validate
Run:
```sh
node --check app-secure.js
node --check quiz-engine.js
node --check quizzes/index.js
node --check public/multi-quiz.js
node scripts/validate-quizzes.mjs
git diff --check
```
Then sandbox-test catalogue, product detail, preview, checkout creation, verified webhook, access email, remaining questions, result persistence and expired access.

## Release
website-qa and quiz-qa must report release blockers. Assemble RELEASE_REVIEW evidence: exact commit, validation output, sandbox result, known limits, price/offer, rollback path and owner approval. Only the owner may authorize the Docker rebuild/restart and any live Stripe move.
