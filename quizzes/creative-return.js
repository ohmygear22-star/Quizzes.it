const options = [
  { id: "1", text: "Rarely", value: 1 }, { id: "2", text: "Occasionally", value: 2 }, { id: "3", text: "Sometimes", value: 3 }, { id: "4", text: "Often", value: 4 }, { id: "5", text: "Almost always", value: 5 }
];
const question = (id, text) => ({ id, text, options });
export default {
  id: "creative-return", slug: "how-do-you-return-to-creative-work", version: 1, status: "live",
  metadata: { title: "How Do You Return to Creative Work?", description: "Explore the conditions that help you begin making again.", category: "creative-self-reflection", targetCustomer: "Adults who want a gentler way back into personal creative work", durationMinutes: 3, accessDays: 7 },
  preview: { enabled: true, questionIds: ["creative-return-01", "creative-return-02", "creative-return-03", "creative-return-04", "creative-return-05"], teaser: {
    heading: "What your first answers suggest",
    observations: {
      permission: "You may return to creative work more easily when early effort feels witnessed or welcomed.",
      craft: "You may regain momentum by defining a smaller, kinder standard for a first version.",
      input: "You may come back to making through fresh material, surroundings, or conversation.",
      rhythm: "You may rebuild creative trust through a small practice you can repeat."
    },
    uncertainty: "Your early answers point to more than one possible re-entry pattern.",
    next: "The remaining questions distinguish the conditions that support your next return to creative work."
  } },
  offers: [{ id: "full-result", label: "Full private analysis", currency: "hkd", amount: 2900 }],
  questions: [
    ["01", "Before I begin something meaningful to me, I look for a sign that it will be worth the effort."],
    ["02", "I can keep refining an early version long after it would be useful to share it."],
    ["03", "A change of scene or new input often restores my interest in making something."],
    ["04", "I return more easily when I repeat a small familiar ritual."],
    ["05", "When I call myself stuck, it often means I have not chosen what would count as enough for today."],
    ["06", "I feel more ready after someone I trust responds warmly to an early attempt."],
    ["07", "New images, conversations, or constraints can give me a way back into a project."],
    ["08", "A short recurring practice works better for me than waiting for a large open block of time."],
    ["09", "Silence from other people can make me doubt whether I should continue."],
    ["10", "Too many possible versions can make it hard for me to release one."],
    ["11", "I make progress after collecting material without demanding an outcome immediately."],
    ["12", "I protect a small recurring appointment with my work, even when progress is quiet."]
  ].map(([number, text]) => question("creative-return-" + number, text)),
  branching: { rules: [] },
  scoring: { method: "profile-sum", dimensions: [
    { id: "permission", resultId: "permission-finder", questionIds: ["creative-return-01", "creative-return-06", "creative-return-09"] },
    { id: "craft", resultId: "craft-protector", questionIds: ["creative-return-02", "creative-return-05", "creative-return-10"] },
    { id: "input", resultId: "input-explorer", questionIds: ["creative-return-03", "creative-return-07", "creative-return-11"] },
    { id: "rhythm", resultId: "rhythm-builder", questionIds: ["creative-return-04", "creative-return-08", "creative-return-12"] }
  ] },
  results: [
    { id: "permission-finder", customerPerspective: { title: "Permission Finder", summary: "You may return more easily when early work feels welcomed before it is judged.", strength: "You are attentive to whether a creative space feels safe enough to enter.", blindSpot: "Waiting for reassurance can let another person's response decide when you begin.", reflection: "What small piece could you make for one receptive person, without asking it to prove your worth?" }, analyticalPerspective: { pattern: "Relational permission", evidence: "Your answers placed the strongest weight on being received, encouraged, and externally affirmed before continuing.", caveats: "This is a self-reflection lens, not a measure of talent, motivation, or mental health." } },
    { id: "craft-protector", customerPerspective: { title: "Craft Protector", summary: "You may return through a more humane definition of finished for today.", strength: "You care about making work that feels considered and true to your standards.", blindSpot: "Protecting quality can turn an early draft into a threshold that is too high to cross.", reflection: "What would be a useful first version if it did not need to represent your best work?" }, analyticalPerspective: { pattern: "Standards and release", evidence: "Your answers placed the strongest weight on refinement, thresholds, and the difficulty of choosing one version.", caveats: "This is a self-reflection lens, not a measure of talent, motivation, or mental health." } },
    { id: "input-explorer", customerPerspective: { title: "Input Explorer", summary: "You may return by letting new material lead you back into your own work.", strength: "You notice connections, texture, and possibility in the world around you.", blindSpot: "Gathering inspiration can postpone the moment when your own response needs room.", reflection: "What single piece of input could you answer with a ten-minute experiment today?" }, analyticalPerspective: { pattern: "Stimulation and association", evidence: "Your answers placed the strongest weight on fresh settings, material, and open-ended collection.", caveats: "This is a self-reflection lens, not a measure of talent, motivation, or mental health." } },
    { id: "rhythm-builder", customerPerspective: { title: "Rhythm Builder", summary: "You may return by trusting small repeated conditions more than a perfect mood.", strength: "You know how to build continuity without requiring dramatic progress.", blindSpot: "A protective routine can become another reason to wait when the day looks different.", reflection: "What is the smallest version of your practice that still counts on an imperfect day?" }, analyticalPerspective: { pattern: "Ritual and continuity", evidence: "Your answers placed the strongest weight on recurring practice, familiar cues, and modest protected time.", caveats: "This is a self-reflection lens, not a measure of talent, motivation, or mental health." } }
  ],
  marketing: { angles: ["A gentle return to making", "Find the condition that helps you begin again"], hooks: [] },
  seo: { title: "How Do You Return to Creative Work? | Quizzes it", description: "A private self-reflection quiz about returning to personal creative work.", canonicalPath: "/quiz/how-do-you-return-to-creative-work" }
};
