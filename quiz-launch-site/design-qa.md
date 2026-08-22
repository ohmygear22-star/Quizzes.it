# Launch site design QA

## Comparison target

- Source visual truth: `/Users/annayip/.codex/generated_images/01a005c1-56cb-7753-b29f-fcc04cb20dcd/exec-bd92ecec-7b73-4fd3-af93-e8546baae521.png`
- Implementation: browser-rendered `http://localhost:4177/`
- Compared states: mobile landing page and mobile All Quizzes page, default (not signed in)
- Source: 852 × 1847 px. Implementation: 390 × 844 CSS px, browser capture at the same mobile layout breakpoint. The difference in overall screenshot height is expected because the website includes its required navigation, policy and support pages.

## Findings

- [Resolved P1] Hero artwork was initially behind the black page layer on mobile.
  - Fix: raised `.hero-ink` above the page layer and kept the content above it with explicit stacking levels.
  - Post-fix evidence: browser capture at `http://localhost:4176/` after the CSS correction.

## Fidelity surfaces

- Typography: the full site now uses exactly the three styles selected in the latest reference: DM Mono for compact labels, navigation and metadata; Playfair Display for headings; and DM Sans for all reading text, links and actions. Decorative serif treatment has been removed from buttons and the support email link.
- Spacing and layout: large headline, narrow mobile content column, bordered quiz promise, prominent full-width action, and quiet reassurance match the visual structure while remaining responsive for desktop.
- Colours: near-black background, warm ivory text, restrained wine-red action and border accent. Contrast remains strong.
- Image quality: generated `public/ink-hero.png` is a dedicated maroon-and-black ink asset; no CSS art or placeholder artwork is used.
- Copy: intentional product changes from the source are retained: `QUIZZES IT` replaces `SHADOW SELF`, and `Choose this quiz` replaces `Start free` because this is a pay-before-access product. “No sign-up required” is explicit.
- Homepage refinement: the oversized numbered step strip has been removed, the hero heading now uses a more compact scale, and the remaining content follows a clearer reading order: question, promise, action, privacy reassurance, then the quiet catalogue link.
- Responsive navigation: desktop and 390 px mobile views keep All quizzes, How it works and Support directly accessible without horizontal overflow. The upper navigation now uses the same clean DM Sans family as supporting copy, at 16 px desktop / 12 px mobile; the EN control uses the same style at 17 px desktop / 14 px mobile.
- New-page consistency: catalogue, quiz detail, how-it-works, policy and support views retain the same near-black, warm-ivory and restrained wine-red system rather than introducing a different template.

## Functional evidence

- Landing → email → payment-safe placeholder → access → all quiz questions → result: passed.
- Retake: passed.
- Catalogue: four quiz entries render; the live launch quiz opens its detail and purchase flow; three dummy names correctly state Coming soon.
- Header and footer: All quizzes, How it works, Support, Privacy and Terms each open a working page. The small upper-right navigation has been reduced further for a quieter hierarchy.
- Legal-copy route: privacy and terms are separate, readable pages.
- Final-purchase rule: shown on the quiz detail and checkout views before a customer reaches payment, and retained in Terms of Use. The former refund route and every visible refund-policy link have been removed.
- Mobile checks at 390 × 844: landing and catalogue layout passed with `scrollWidth = 390` (no horizontal overflow).
- Browser console errors during the customer journey: none.
- Production bundle: passed.

## Follow-up polish

- The language selector is visual-only until additional language content is defined.

## Final result

passed
