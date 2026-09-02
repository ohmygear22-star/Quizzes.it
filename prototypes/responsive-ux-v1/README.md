# Responsive UX v1 — review prototype

## Scope
An isolated clickable prototype for the Quizzes it responsive UX review. It is not served by the production app, does not call Stripe, and does not send email or create access records.

## Open
http://152.42.220.26:4173/

If the temporary server is stopped, run from the Droplet:

`python3 -m http.server 4173 --bind 0.0.0.0 --directory /opt/quizzes/app/prototypes/responsive-ux-v1`

## Review controls
Choose **English** or **繁體中文** from the globe button. The separate menu button contains only All quizzes, How it works, and Support. The review toolbar exposes the same production journey screens: home, catalog, detail, preview, insight, paywall, access, adaptive question, and result. Privacy, Terms, and Support are footer links. Retake, payment-status, and email are intentionally not separate screens.

All post-payment views use safe fixtures. No form submits live data.

## Revision decisions
- The product is presented as quizzes and personal reflection, not only “Private self-discovery”.
- Home copy now uses “Start with five-question preview…” and shows HK$29 once-only pricing.
- The primary CTA is “Start the quiz”.
- Quiz labels use “QUESTION”; early-signal/early-insight copy is removed.
- Paywall payment-detail boxes are removed; saved-copy is “Your answers are saved.”
- Result content remains unchanged from the production version.
- English uses restrained display type; Traditional Chinese uses a CJK-safe sans stack.
- Mobile uses a compact header, globe language control, one secondary-links menu, 20px margins, and smaller question guidance text.

## Approval boundary
This package is for review only. Do not apply it to production application source until the owner explicitly sends:

RESPONSIVE UX PROTOTYPE APPROVED — IMPLEMENT ON FEATURE BRANCH
