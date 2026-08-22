const options = [
  { id: "1", text: "Not at all like me", value: 1 }, { id: "2", text: "Slightly like me", value: 2 }, { id: "3", text: "Somewhat like me", value: 3 }, { id: "4", text: "Mostly like me", value: 4 }, { id: "5", text: "Very much like me", value: 5 }
];
const question = (id, text) => ({ id, text, options });
export default {
  id: "recognition-pattern", slug: "how-do-you-seek-recognition", version: 1, status: "live",
  metadata: { title: "How Do You Seek Recognition?", description: "Explore the instinct beneath validation, attention and vulnerability.", category: "self-discovery", targetCustomer: "Adults seeking a private self-reflection experience", durationMinutes: 3, accessDays: 7 },
  preview: {
    enabled: true,
    questionIds: ["recognition-01", "recognition-02", "recognition-03", "recognition-04", "recognition-05"],
    teaser: {
      heading: "What your first answers suggest",
      observations: {
        spotlight: "You seem alert to how your contribution is noticed and acknowledged.",
        control: "You seem attentive to how shared decisions take shape when something matters.",
        guarded: "You seem sensitive to what happens when you feel misunderstood or exposed."
      },
      uncertainty: "We're seeing signs of more than one possible pattern.",
      next: "The remaining questions look at praise, criticism, closeness, and attention to build a fuller picture."
    }
  },
  offers: [{ id: "full-result", label: "Full private analysis", currency: "hkd", amount: 2900 }],
  questions: [
    question("recognition-01", "I notice quickly when my contribution to a group goes unrecognised."), question("recognition-02", "I feel most comfortable when I can shape how a shared plan unfolds."), question("recognition-03", "Being misunderstood can make me withdraw rather than explain myself."), question("recognition-04", "I enjoy being seen as someone with unusually strong taste, ability, or insight."), question("recognition-05", "I find it difficult to let others make an important decision when I think I could do it better."), question("recognition-06", "I protect my image carefully when I feel exposed or criticised."), question("recognition-07", "Praise motivates me more than I usually admit."), question("recognition-08", "I often take charge because waiting for others feels inefficient."), question("recognition-09", "I can become guarded when someone gets emotionally close to me."), question("recognition-10", "I care about making an impression, even when I tell myself I do not."), question("recognition-11", "I feel uneasy when someone else becomes the centre of attention in an area I value."), question("recognition-12", "I prefer to reveal my softer side only when I know it will be handled well.")
  ],
  branching: { rules: [] },
  scoring: { method: "profile-sum", dimensions: [
    { id: "spotlight", resultId: "visible-achiever", questionIds: ["recognition-01", "recognition-04", "recognition-07", "recognition-10"] },
    { id: "control", resultId: "quiet-director", questionIds: ["recognition-02", "recognition-05", "recognition-08", "recognition-11"] },
    { id: "guarded", resultId: "protected-core", questionIds: ["recognition-03", "recognition-06", "recognition-09", "recognition-12"] }
  ] },
  results: [
    { id: "visible-achiever", customerPerspective: { title: "Visible Achiever", summary: "You notice where your contributions can make a difference.", strength: "You notice where your contributions can make a difference.", blindSpot: "Being seen can start to feel like the measure of your value.", reflection: "Where could you offer your ability without needing it to prove anything?" }, analyticalPerspective: { pattern: "Recognition sensitivity", evidence: "Your answers placed the strongest weight on visibility and acknowledgement.", caveats: "This is a self-reflection prompt, not a diagnosis." } },
    { id: "quiet-director", customerPerspective: { title: "Quiet Director", summary: "You bring structure and momentum when things feel uncertain.", strength: "You bring structure and momentum when things feel uncertain.", blindSpot: "Taking charge can make shared responsibility harder to trust.", reflection: "What might become possible if you left room for someone else to lead?" }, analyticalPerspective: { pattern: "Control and responsibility", evidence: "Your answers placed the strongest weight on taking charge and shaping outcomes.", caveats: "This is a self-reflection prompt, not a diagnosis." } },
    { id: "protected-core", customerPerspective: { title: "Protected Core", summary: "You are discerning about what and whom you let close.", strength: "You are discerning about what and whom you let close.", blindSpot: "Protecting yourself can make genuine closeness feel more risky than it is.", reflection: "What would a small, safe act of openness look like today?" }, analyticalPerspective: { pattern: "Guarded vulnerability", evidence: "Your answers placed the strongest weight on privacy and emotional self-protection.", caveats: "This is a self-reflection prompt, not a diagnosis." } }
  ],
  marketing: { angles: [], hooks: [] }, seo: { title: "How Do You Seek Recognition? | Quizzes it", description: "A private self-reflection quiz about attention, validation and vulnerability.", canonicalPath: "/quiz/how-do-you-seek-recognition" }
};
