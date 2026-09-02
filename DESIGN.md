# Quizzes.it Design Context

## Product and audience

Quizzes.it is a private, paid self-reflection product for adults who want a clear, emotionally safe way to examine relationship patterns. The interface supports English and Hong Kong written Traditional Chinese (`zh-Hant`) equally. It must feel thoughtful and direct without implying clinical diagnosis or scientific certainty.

## Visual direction

- **Thesis:** a private late-night editorial reflection, not a dashboard or personality-test toy.
- **Palette:** Ink `#090909`, Panel `#151113`, Paper `#f9f1e7`, Muted `#c8b8ae`, Wine `#a6364b`, Rose `#ca5269`.
- **Display:** Playfair Display / Georgia for high-emotion English headlines; the system Traditional Chinese sans stack for zh-Hant headlines.
- **Body:** DM Sans and the system sans stack; DM Mono only for small labels, counts, and metadata.
- **Signature:** evidence-led result sections that move from an editorial headline to concrete selected answers, then four distinct reading voices.

## Layout contract

- The result hero and eight-phase interpretation remain the primary hierarchy.
- Desktop result content uses deliberate two-column grids with equal-width, minimum-zero tracks. Long copy must wrap and never force narrow side columns.
- Selected-answer evidence is always shown as question, answer, and why it mattered.
- Four result voices use a two-column desktop grid and native `details` accordions on mobile.
- Legacy saved results without the new deterministic fields remain readable through the original eight-phase fallback.
- Mobile is a first-class single-column experience with full-width actions and visible focus states.

## Interaction and accessibility

- Native buttons, links, and `details/summary` own interaction semantics.
- Keyboard focus remains visible; hover is never the only disclosure mechanism.
- Touch controls retain at least the existing 52px action height.
- Locale changes rerender the active route without losing preview answers.
- Do not expose engine IDs, margins, pair-separation values, or debug language to customers.
- No live-generated question or result prose. Customer interpretation is deterministic and source-backed.
