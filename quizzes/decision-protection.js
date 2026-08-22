const options = [
  { id: "1", text: "Rarely", value: 1 }, { id: "2", text: "Occasionally", value: 2 }, { id: "3", text: "Sometimes", value: 3 }, { id: "4", text: "Often", value: 4 }, { id: "5", text: "Almost always", value: 5 }
];
const question = (id, text) => ({ id, text, options });
export default {
  id: "decision-protection", slug: "what-do-you-need-a-decision-to-protect", version: 1, status: "live",
  metadata: { title: "What Do You Need a Decision to Protect?", description: "Explore the hidden demand you place on a meaningful choice.", category: "decision-self-reflection", targetCustomer: "Adults reflecting on a meaningful personal or professional choice", durationMinutes: 3, accessDays: 7 },
  preview: { enabled: true, questionIds: ["decision-protection-01", "decision-protection-02", "decision-protection-03", "decision-protection-04", "decision-protection-05"], teaser: {
    heading: "What your first answers suggest",
    observations: {
      responsibility: "You may begin by protecting the people and consequences connected to a choice.",
      certainty: "You may need a decision to feel well-founded before you can move.",
      possibility: "You may be protecting futures or identities that feel hard to close.",
      momentum: "You may trust a small reversible move more than a final answer."
    },
    uncertainty: "Your early answers suggest more than one demand may be shaping this decision.",
    next: "The remaining questions distinguish responsibility, evidence, possibility, and experimentation."
  } },
  offers: [{ id: "full-result", label: "Full private analysis", currency: "hkd", amount: 2900 }],
  questions: [
    ["01", "Before choosing, I first picture who might be affected by the outcome."],
    ["02", "I become calmer once I can name the evidence I would need to proceed."],
    ["03", "Closing one option can feel like losing a version of my future self."],
    ["04", "I move more easily when the next step can be revised later."],
    ["05", "I often take responsibility for consequences that other people have not asked me to carry."],
    ["06", "I keep looking for information after I already know what matters most to me."],
    ["07", "I prefer to leave a door open rather than disappoint a possibility."],
    ["08", "I learn what I want by trying a contained version of it."],
    ["09", "A choice feels incomplete until I have considered its effect on the people around me."],
    ["10", "I trust a decision more when I can explain its basis clearly to myself."],
    ["11", "I hesitate when deciding seems to make one identity impossible."],
    ["12", "A useful experiment can matter more to me than a final answer."]
  ].map(([number, text]) => question("decision-protection-" + number, text)),
  branching: { rules: [] },
  scoring: { method: "profile-sum", dimensions: [
    { id: "responsibility", resultId: "responsibility-keeper", questionIds: ["decision-protection-01", "decision-protection-05", "decision-protection-09"] },
    { id: "certainty", resultId: "certainty-builder", questionIds: ["decision-protection-02", "decision-protection-06", "decision-protection-10"] },
    { id: "possibility", resultId: "possibility-holder", questionIds: ["decision-protection-03", "decision-protection-07", "decision-protection-11"] },
    { id: "momentum", resultId: "momentum-tester", questionIds: ["decision-protection-04", "decision-protection-08", "decision-protection-12"] }
  ] },
  results: [
    { id: "responsibility-keeper", customerPerspective: { title: "Responsibility Keeper", summary: "You may need a choice to account for the people and consequences around it.", strength: "You take downstream effects seriously and notice obligations others might miss.", blindSpot: "Carrying every possible consequence can make a decision feel heavier than it is yours to hold.", reflection: "Which consequence is genuinely yours to consider, and which belongs to someone else?" }, analyticalPerspective: { pattern: "Responsibility weighting", evidence: "Your answers placed the strongest weight on people, obligations, and possible downstream effects.", caveats: "This is a self-reflection lens, not advice about the correct decision or a measure of anxiety." } },
    { id: "certainty-builder", customerPerspective: { title: "Certainty Builder", summary: "You may need a choice to feel well-founded before you can release it.", strength: "You value clarity, evidence, and being able to explain your reasoning.", blindSpot: "More information can become a substitute for naming the uncertainty no fact can remove.", reflection: "What is the next fact you truly need, and what uncertainty will remain even after you have it?" }, analyticalPerspective: { pattern: "Evidence seeking", evidence: "Your answers placed the strongest weight on information, reasoning, and a clear basis for moving.", caveats: "This is a self-reflection lens, not advice about the correct decision or a measure of anxiety." } },
    { id: "possibility-holder", customerPerspective: { title: "Possibility Holder", summary: "You may need a choice to leave room for the futures it could close.", strength: "You can see the identity, imagination, and potential contained in an option.", blindSpot: "Protecting every future can make the present feel unable to begin.", reflection: "Which possibility matters enough to honour, even if it cannot remain fully open?" }, analyticalPerspective: { pattern: "Possibility preservation", evidence: "Your answers placed the strongest weight on open doors, future identities, and the cost of closure.", caveats: "This is a self-reflection lens, not advice about the correct decision or a measure of anxiety." } },
    { id: "momentum-tester", customerPerspective: { title: "Momentum Tester", summary: "You may need a choice to create movement without demanding certainty first.", strength: "You learn through action and can reduce pressure by making a decision testable.", blindSpot: "An experiment can remain a holding pattern if it never receives a moment of review.", reflection: "What small test would teach you something real, and when will you decide what it showed?" }, analyticalPerspective: { pattern: "Experiment-led movement", evidence: "Your answers placed the strongest weight on reversibility, trial, and learning through a contained next step.", caveats: "This is a self-reflection lens, not advice about the correct decision or a measure of anxiety." } }
  ],
  marketing: { angles: ["See what a difficult choice is asking you to protect", "A private reflection before you decide"], hooks: [] },
  seo: { title: "What Do You Need a Decision to Protect? | Quizzes it", description: "A private self-reflection quiz about what a meaningful decision is asking you to protect.", canonicalPath: "/quiz/what-do-you-need-a-decision-to-protect" }
};
