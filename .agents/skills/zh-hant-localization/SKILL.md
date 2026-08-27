# Traditional Chinese Localization

## Purpose
Adapt Quiz copy for fluent Traditional Chinese readers. This wording-quality skill never changes quiz IDs, answer IDs, scoring, branching, prices, Stripe identifiers, access tokens, or runtime behavior.

## Principle
Write for the reader, not word-for-word from English. Preserve meaning, intent, emotional temperature, and actionability with concise, warm, plain language.

## Locale boundary
Customer locales are \`en\` and \`zh-Hant\` only. Never author or expose \`zh-CN\`. Preserve locale selection, persistence, and fallback behavior.

## Workflow
SOURCE context (screen, state, CTA) → natural Hant draft → terminology check → placeholder/link/number/identifier check → independent \`zh-hant-content-qa\` review. Flag uncertain claims; do not invent policy or payment promises.

## Surface rules
- Navigation/UI: short verb-led labels; use 「查看測驗」「支援」「條款」「私隱」「電郵」「付款」.
- Questions: conversational, specific, non-clinical, emotionally safe; use 「你」 consistently.
- Answers: parallel grammar and comparable length; believable responses, not glosses.
- Preview/paywall: state free scope, unlock scope, price/currency, one-time nature, and access duration plainly; use 「解鎖完整分析」.
- Results: keep friend-style and professional/direct voices distinct; avoid diagnostic certainty.
- Access email: warm and concise; explain private link, expiry, and continuation without adding result-email behavior.

## Mechanics
Use Traditional characters and intentional Chinese punctuation. Avoid Simplified characters, mixed scripts, literal calques, unnecessary English, and mechanically copied punctuation. Keep URLs, product names, currency codes, placeholders, and IDs unchanged. Check mobile wrapping; shorten or split copy rather than shrinking type.

## Checklist
Meaning and tone preserved; natural syntax; consistent terminology; parallel choices; clear CTA; no unsupported claims; no unintended English leakage; mobile-safe length; identifiers intact.
