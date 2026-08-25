# V5 Authored Response Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace shared adaptive answer tails with unique, situation-led first-person response copy while preserving historical quiz versions.

**Architecture:** Add a v5 builder that turns every question's own situation and round into distinct answer copy and selection-specific evidence. Clone the six v4 definitions to v5 and register all versions so stored purchases continue resolving to their original definition.

**Tech Stack:** Node.js ES modules, existing quiz registry, existing validation scripts.

**Spec:** Product-review marker at Build and Test!G10.

## Global Constraints

- v4 remains available for existing paid access links.
- v5 must expose six public adaptive quizzes with 55 questions each.
- No answer may use the former shared contextual-tail phrasing.

### Task 1: Contract test

- [ ] Add scripts/check-authored-response-v5.mjs.
- [ ] Run it before v5 exists; expected failure: a public quiz is not version 5.

### Task 2: Versioned builder and definitions

- [ ] Create quizzes/experience-quiz-builder-v5.js with first-person scenario-specific copy and selection-specific evidence.
- [ ] Create six v5 definitions cloned from v4 configuration with version 5.
- [ ] Register v5 definitions in quizzes/index.js.

### Task 3: Verification

- [ ] Run the v5 contract, syntax checks, validation, and existing response-quality checks.
- [ ] Keep deployment out of scope pending release review.
