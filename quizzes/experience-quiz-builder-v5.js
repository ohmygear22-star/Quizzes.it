const mk = (id, text, investigates, situation, options) => ({
  id,
  text,
  reason: "This specific situation distinguishes the response you are most likely to choose.",
  investigates,
  situation,
  options: options.map(([id, text, signal]) => ({
    id,
    text,
    signals: { [signal]: 3 },
    evidence: 'In response to ' + situation + ', you selected: ' + text
  }))
});

const lenses = [
  (s) => "When " + s + ", which response is closest to what you would actually do?",
  (s) => "If " + s + " kept sitting with you, what would you be most likely to do?",
  (s) => "After " + s + ", what would help you decide what comes next?",
  (s) => "If " + s + " happened again, what response would feel truest?",
  (s) => "Thinking about " + s + ", what would you want to protect?"
];

const firstPerson = (s) => s
  .replace(/\byour\b/gi, "my")
  .replace(/\byou\b/gi, "I");

const responseCopy = (situation, choiceIndex, variation) => {
  const context = firstPerson(situation);
  const direct = [
    "I would say that " + context + " has affected me and ask what is happening.",
    "I would put " + context + " into words instead of hoping it will pass.",
    "I would ask for an honest conversation about " + context + ".",
    "I would name what " + context + " brings up for me before drawing a conclusion.",
    "I would check in directly about " + context + " so I do not have to guess.",
    "I would explain why " + context + " matters to me and listen to the answer.",
    "I would ask whether " + context + " is something we need to work through together."
  ];
  const pause = [
    "I would give myself time before deciding what " + context + " means.",
    "I would take a little distance so I can respond to " + context + " without escalating it.",
    "I would wait until I know what I need before I raise " + context + ".",
    "I would let the first reaction settle and notice what " + context + " still brings up.",
    "I would keep " + context + " private for a moment while I work out my own view.",
    "I would pause rather than make " + context + " into an urgent conversation.",
    "I would step back long enough to tell whether " + context + " is a passing feeling."
  ];
  const practical = [
    "I would look for the practical next step that " + context + " calls for.",
    "I would ask what would make " + context + " less likely to repeat.",
    "I would focus on what needs to be clearer after " + context + ".",
    "I would look for a reliable agreement that addresses " + context + ".",
    "I would separate the feeling from the decision and work out what " + context + " changes.",
    "I would ask what follow-through would make " + context + " feel safer.",
    "I would turn " + context + " into one concrete question about expectations."
  ];
  const libraries = [direct, pause, practical];
  const fallback = [
    "I would notice what " + context + " tells me about what I need.",
    "I would give myself room to understand what " + context + " brings up.",
    "I would look for the clearest way to respond to " + context + "."
  ];
  const base = (libraries[choiceIndex] || fallback)[variation % 7];
  const interpretations = [
    ["I would rather name the uncertainty than carry it alone.", "I want to hear the answer before I decide what it means.", "I trust a direct conversation more than a private story.", "I do not want a small moment to become a silent distance.", "I would rather understand the change than fill in the gaps.", "I can be honest about impact without demanding a perfect reply.", "I want both of us to know what this moment has brought up."],
    ["I need a moment to hear my own reaction clearly.", "I do not want to speak from the first rush of feeling.", "I can return to it when I know what I am asking for.", "I need to tell the difference between hurt and urgency.", "I would rather choose my words than send them too soon.", "I can hold the feeling without making it the whole story.", "I need space that helps me come back, not disappear."],
    ["I feel safer when the next step is concrete.", "I want to know what will be different after this.", "I am looking for follow-through, not only reassurance.", "I need to separate what can be solved from what needs care.", "I feel steadier when expectations are named plainly.", "I want an agreement I can recognise in everyday behaviour.", "I am trying to make room for both feeling and action."]
  ];
  return base + " " + (interpretations[choiceIndex] || interpretations[2])[variation % 7];
};

export function buildAdaptiveQuiz(c) {
  const signals = c.signals.map((signal) => signal.id);
  const questionCount = c.deep ? 55 : 20;
  const questions = Array.from({ length: questionCount }, (_, index) => {
    const situation = firstPerson(c.scenes[index % c.scenes.length]);
    const variation = index;
    const primary = signals[index % signals.length];
    const secondary = signals[(index + 1) % signals.length];
    return mk(
      c.id + "-" + String(index + 1).padStart(2, "0"),
      lenses[variation % lenses.length](situation),
      [primary, secondary],
      situation,
      c.signals.map((signal, choiceIndex) => [
        "a" + signal.id,
        responseCopy(situation, choiceIndex, variation),
        signal.id
      ])
    );
  });
  const dimensions = Object.fromEntries(c.signals.map((signal) => [signal.id, {
    label: signal.label,
    title: signal.title,
    story: signal.story,
    strength: signal.strength,
    blindSpot: signal.blindSpot,
    reflection: signal.reflection,
    pattern: signal.pattern,
    caveat: "This is a reflection on your answers, not a diagnosis or a fixed label.",
    uncomfortable: signal.uncomfortable,
    alternative: signal.alternative
  }]));
  return {
    id: c.id,
    slug: c.slug,
    version: c.version ?? 5,
    status: "live",
    metadata: { title: c.title, description: c.description, category: c.category, targetCustomer: "Adults looking for a private self-reflection experience", durationMinutes: c.deep ? 12 : 5, questionRange: c.deep ? "50–55 adaptive questions" : "15–20 adaptive questions", accessDays: 7 },
    seo: { title: c.title + " | Quizzes it", description: c.description, canonicalPath: "/quiz/" + c.slug },
    offers: [{ id: "full-result", label: "Full private analysis", currency: "hkd", amount: 2900 }],
    flow: { mode: "adaptive-investigation-v1", previewQuestionIds: questions.slice(0, 5).map((question) => question.id), minQuestions: questionCount, maxQuestions: questionCount, confidenceMargin: 999 },
    questions,
    teaser: { heading: "Your answers point to something worth looking at.", observations: Object.fromEntries(c.signals.map((signal) => [signal.id, signal.teaser])), uncertainty: "There is more than one possible reason for this pattern.", next: c.next },
    resultBlueprint: { dimensions, watchNext: Object.fromEntries(c.signals.map((signal) => [signal.id, signal.watchNext])) }
  };
}
