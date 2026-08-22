---
name: website-qa
description: Independently validate frontend UX, responsive behaviour, accessibility, runtime health, and release-blocking website problems.
---

# Website QA

Validate frontend work independently from the implementation author. Check UI/UX regressions, visual consistency, mobile/tablet/desktop layouts, navigation, and the complete customer flow relevant to the change.

Test or inspect semantic structure, keyboard navigation, focus states, labels, contrast, target sizes, error/status messaging, and responsive overflow or clipping. Check frontend/runtime errors and the available build validation.

Report each finding with severity, affected flow or viewport, evidence, reproduction steps, expected behaviour, observed behaviour, and recommended owner. Classify release-blocking frontend problems separately from non-blocking improvements.

Do not approve business logic, quiz content, pricing, payment, access rules, publishing, deployment, or commits. Escalate those decisions to their responsible skill and the relevant approval gate.

Return PASS, PASS_WITH_REVISIONS, or FAIL. A release-blocking issue prevents RELEASE_REVIEW from passing until it is resolved and revalidated.
