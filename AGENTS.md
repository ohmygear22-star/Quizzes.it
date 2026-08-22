# Agentic Quiz Operating Guide

## Scope

This repository operates a paid, private self-discovery quiz business. The intended experience is one purchase per quiz, private email-bound access, temporary data, and retakes during a seven-day access period.

The current live implementation is not yet a reusable multi-quiz architecture. Do not treat older prototypes as product truth.

Create Agentic Quiz artifacts and production code on the DigitalOcean Droplet repository only, never in a local computer checkout.

## Routing

- Use a dynamic intelligence skill for decisions involving trends, audience behaviour, competition, pricing, marketing, or sales. Retrieve current evidence first.
- Quiz content and logic: market-intelligence -> opportunity-scoring -> quiz-architect -> quiz-qa.
- General website UI, UX, frontend, layout, navigation, accessibility, or safe frontend refactoring: website-architect.
- Frontend validation and release-blocking presentation/runtime issues: website-qa.
- New approved quiz implementation: use publish-quiz when its SOP is ready.
- Existing quiz implementation changes: use update-quiz when its SOP is ready.
- Keep business logic and website presentation responsibilities separate.

## Evidence labels

Separate every substantive output into:

- **FACT**: source-backed, dated statement.
- **OBSERVATION**: interpretation of facts, with limits.
- **HYPOTHESIS**: an unproven, testable claim.
- **RECOMMENDATION**: a proposed action and rationale.

Record source URLs, observation dates, retrieval windows, and confidence. Stored conclusions are inputs to retest, not permanent facts.

## Hypothesis record

Each hypothesis includes: ID, claim, evidence (supporting and contrary), confidence, assumptions, test method, measurable success/failure criteria, and status: PROPOSED, TESTING, SUPPORTED, NOT_SUPPORTED, INCONCLUSIVE, or RETIRED.

## Originality and safety

Research competitor patterns only: audience, positioning, offer, price presentation, title structure, and funnel shape. Never copy competitor questions, results, distinctive wording, creative assets, or paid content.

Do not diagnose medical or mental-health conditions or present uncertain interpretations as facts.

## Approval gates

- **IDEA_REVIEW**: evidence, opportunity score, risks, and proposed direction.
- **PRODUCT_REVIEW**: quiz draft, QA outcome, commercial package, and open issues.
- **RELEASE_REVIEW**: implementation evidence, validation, known limitations, and release plan.
- **MARKETING_REVIEW**: objective, audience, creative, spend, metrics, and stop criteria.

Explicit owner approval is required before production publishing, deployment, price changes, paid marketing, external spending, or destructive action. Silence is not approval.

## Phase 1 boundary

Do not modify the live application implementation as part of Agentic Quiz Phase 1. Preserve existing uncommitted work unless the owner explicitly directs otherwise.
