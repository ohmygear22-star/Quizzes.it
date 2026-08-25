const uniq = (items) => [...new Set(items)];

export function validateAdaptiveQuiz(quiz) {
  const errors = [];
  if (!quiz || quiz.flow?.mode !== "adaptive-investigation-v1") return ["Not an adaptive-investigation-v1 quiz"];
  const { flow } = quiz;
  if (!Number.isInteger(flow.minQuestions) || !Number.isInteger(flow.maxQuestions) || flow.minQuestions < 5 || flow.maxQuestions < flow.minQuestions) errors.push("Invalid adaptive question range");
  if (!Array.isArray(flow.previewQuestionIds) || flow.previewQuestionIds.length !== 5) errors.push("Adaptive preview must contain exactly five questions");
  const ids = new Set();
  for (const question of quiz.questions || []) {
    if (!question.id || ids.has(question.id) || !question.text || !question.reason || !Array.isArray(question.options) || question.options.length < 3) errors.push("Invalid adaptive question");
    ids.add(question.id);
    const optionIds = new Set();
    for (const option of question.options || []) {
      if (!option.id || optionIds.has(option.id) || !option.text || !option.signals || !option.evidence) errors.push("Invalid adaptive answer option");
      optionIds.add(option.id);
    }
  }
  if ((flow.previewQuestionIds || []).some((id) => !ids.has(id))) errors.push("Unknown preview question");
  if ((quiz.questions || []).length < flow.minQuestions) errors.push("Not enough questions for adaptive minimum");
  if (!quiz.teaser?.heading || !quiz.teaser?.observations || !quiz.teaser?.uncertainty || !quiz.teaser?.next) errors.push("Invalid adaptive teaser");
  if (!quiz.resultBlueprint?.dimensions || !quiz.resultBlueprint?.watchNext) errors.push("Missing result blueprint");
  return uniq(errors);
}

export function isAdaptiveQuiz(quiz) { return quiz?.flow?.mode === "adaptive-investigation-v1"; }

export function adaptivePreviewQuestions(quiz) {
  const byId = new Map(quiz.questions.map((question) => [question.id, question]));
  return quiz.flow.previewQuestionIds.map((id) => byId.get(id));
}

function answerRecords(quiz, answers) {
  if (!Array.isArray(answers)) throw new Error("Answers must be an array");
  const byId = new Map(quiz.questions.map((question) => [question.id, question]));
  const records = answers.map((answer) => {
    const question = byId.get(answer?.questionId);
    const option = question?.options.find((item) => item.id === answer?.optionId);
    if (!question || !option) throw new Error("An answer does not match this quiz");
    return { questionId: question.id, optionId: option.id, question, option };
  });
  if (new Set(records.map((record) => record.questionId)).size !== records.length) throw new Error("Each question can be answered only once");
  return records;
}

function signalScores(records) {
  const scores = {};
  for (const { option } of records) for (const [signal, value] of Object.entries(option.signals || {})) scores[signal] = (scores[signal] || 0) + Number(value || 0);
  return scores;
}

function rankedSignals(records) {
  return Object.entries(signalScores(records)).sort((a, b) => b[1] - a[1]).map(([id, score]) => ({ id, score }));
}

function lastSignal(records) {
  const last = records.at(-1);
  if (!last) return null;
  return Object.entries(last.option.signals || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

export function nextAdaptiveQuestion(quiz, answers) {
  const records = answerRecords(quiz, answers);
  const asked = new Set(records.map((record) => record.questionId));
  const preview = adaptivePreviewQuestions(quiz);
  if (records.length < preview.length) return { question: preview[records.length], reason: "The free preview begins with five broad signals." };
  if (records.length >= quiz.flow.maxQuestions) return { question: null, reason: "Maximum evidence range reached." };
  const ranked = rankedSignals(records);
  const topSignal = lastSignal(records) || ranked[0]?.id;
  const candidate = quiz.questions
    .filter((question) => !asked.has(question.id))
    .map((question) => ({ question, score: (question.investigates || []).includes(topSignal) ? 100 : 0 + (question.investigates || []).reduce((sum, signal) => sum + (ranked.find((entry) => entry.id === signal)?.score || 0), 0) }))
    .sort((a, b) => b.score - a.score || a.question.id.localeCompare(b.question.id))[0]?.question;
  if (records.length < quiz.flow.minQuestions) return { question: candidate || null, reason: "More evidence is needed before a result can be written." };
  const top = ranked[0]?.score || 0;
  const next = ranked[1]?.score || 0;
  if (top - next >= quiz.flow.confidenceMargin && records.length >= quiz.flow.minQuestions) return { question: null, reason: "The evidence is sufficiently consistent." };
  return { question: candidate || null, reason: "A follow-up is needed to distinguish competing explanations." };
}

export function evaluateAdaptivePreview(quiz, answers) {
  const records = answerRecords(quiz, answers);
  const previewIds = adaptivePreviewQuestions(quiz).map((question) => question.id);
  if (records.length !== previewIds.length || records.some((record, index) => record.questionId !== previewIds[index])) throw new Error("Complete the preview in order");
  const leading = rankedSignals(records)[0]?.id;
  return {
    heading: quiz.teaser.heading,
    observation: quiz.teaser.observations[leading] || quiz.teaser.observations.default,
    uncertainty: quiz.teaser.uncertainty,
    next: quiz.teaser.next,
    evidenceCount: records.length
  };
}

export function evaluateAdaptiveQuiz(quiz, answers) {
  const records = answerRecords(quiz, answers);
  if (records.length < quiz.flow.minQuestions) throw new Error("More answers are needed before the result is ready");
  const scores = signalScores(records);
  const ranked = rankedSignals(records);
  const primary = ranked[0]?.id || "recognition";
  const secondary = ranked[1]?.id || "protection";
  const evidence = records.map(({ questionId, option }) => ({ questionId, text: option.evidence, signals: option.signals }));
  const blueprint = quiz.resultBlueprint.dimensions[primary] || quiz.resultBlueprint.dimensions.default;
  const alternative = quiz.resultBlueprint.dimensions[secondary] || quiz.resultBlueprint.dimensions.default || blueprint;
  return {
    scores,
    evidenceMap: { observations: evidence, primary, secondary, confidence: Math.max(0.45, Math.min(0.9, 0.5 + ((ranked[0]?.score || 0) - (ranked[1]?.score || 0)) / 40)), alternatives: [alternative.label] },
    result: {
      customerPerspective: { title: blueprint.title, summary: blueprint.story, strength: blueprint.strength, blindSpot: blueprint.blindSpot, reflection: blueprint.reflection },
      analyticalPerspective: { pattern: blueprint.pattern, evidence: evidence.slice(0, 4).map((item) => item.text).join(" "), caveats: blueprint.caveat },
      layers: { story: blueprint.story, pattern: blueprint.pattern, uncomfortableInterpretation: blueprint.uncomfortable, whatCouldMakeThisWrong: alternative.alternative, watchNext: quiz.resultBlueprint.watchNext[primary] || quiz.resultBlueprint.watchNext.default }
    }
  };
}
