export function validateQuiz(quiz) {
  const errors = [];
  if (!quiz || typeof quiz !== "object") return ["Quiz must be an object"];
  for (const field of ["id", "slug", "version", "status", "metadata", "offers", "questions", "scoring", "results"]) if (quiz[field] == null) errors.push("Missing " + field);
  if (!/^[a-z0-9-]+$/.test(quiz.id || "")) errors.push("id must use lowercase letters, digits, and hyphens");
  if (!/^[a-z0-9-]+$/.test(quiz.slug || "")) errors.push("slug must use lowercase letters, digits, and hyphens");
  if (!Number.isInteger(quiz.version) || quiz.version < 1) errors.push("version must be a positive integer");
  if (!["draft", "review", "live", "retired"].includes(quiz.status)) errors.push("Invalid status");
  if (!Array.isArray(quiz.offers) || !quiz.offers.length) errors.push("At least one offer is required");
  const offerIds = new Set();
  for (const offer of quiz.offers || []) {
    if (!offer.id || offerIds.has(offer.id) || !Number.isInteger(offer.amount) || offer.amount < 0 || !offer.currency) errors.push("Invalid or duplicate offer");
    offerIds.add(offer.id);
  }
  const questionIds = new Set();
  for (const question of quiz.questions || []) {
    if (!question.id || questionIds.has(question.id) || !question.text || !Array.isArray(question.options) || question.options.length < 2) errors.push("Invalid or duplicate question");
    questionIds.add(question.id);
    const optionIds = new Set();
    for (const option of question.options || []) {
      if (!option.id || optionIds.has(option.id) || !option.text || !Number.isFinite(option.value)) errors.push("Invalid or duplicate option");
      else optionIds.add(option.id);
    }
  }
  if (quiz.preview != null) {
    if (!quiz.preview.enabled || !Array.isArray(quiz.preview.questionIds) || !quiz.preview.questionIds.length || quiz.preview.questionIds.some((id) => !questionIds.has(id))) errors.push("Invalid preview question IDs");
    if (!quiz.preview.teaser || !quiz.preview.teaser.heading || !quiz.preview.teaser.observations || !quiz.preview.teaser.uncertainty || !quiz.preview.teaser.next) errors.push("Invalid preview teaser");
  }
  if (quiz.scoring?.method !== "profile-sum") errors.push("Only profile-sum scoring is supported in Phase 2");
  const resultIds = new Set((quiz.results || []).map((result) => result.id));
  for (const dimension of quiz.scoring?.dimensions || []) {
    if (!dimension.id || !dimension.resultId || !resultIds.has(dimension.resultId) || !Array.isArray(dimension.questionIds) || dimension.questionIds.some((id) => !questionIds.has(id))) errors.push("Invalid scoring dimension");
  }
  if (!quiz.branching || !Array.isArray(quiz.branching.rules)) errors.push("branching.rules must be an array");
  return [...new Set(errors)];
}

export function assertValidQuiz(quiz) {
  const errors = validateQuiz(quiz);
  if (errors.length) throw new Error("Invalid quiz " + (quiz?.id || "unknown") + ": " + errors.join("; "));
  return quiz;
}

export function publicQuiz(quiz) {
  return {
    id: quiz.id, slug: quiz.slug, version: quiz.version, status: quiz.status,
    metadata: quiz.metadata, offers: quiz.offers, seo: quiz.seo,
    preview: quiz.preview ? { enabled: quiz.preview.enabled, questionCount: quiz.preview.questionIds.length } : { enabled: false, questionCount: 0 }
  };
}

function valuesFor(quiz, questionIds, answers) {
  if (!Array.isArray(answers) || answers.length !== questionIds.length) throw new Error("Please answer every question");
  return questionIds.map((id, index) => {
    const question = quiz.questions.find((item) => item.id === id);
    const option = question?.options.find((item) => item.id === answers[index]);
    if (!option) throw new Error("Please answer every question");
    return option.value;
  });
}

export function previewQuestions(quiz) {
  const ids = quiz.preview?.questionIds || [];
  return quiz.questions.filter((question) => ids.includes(question.id));
}

export function evaluatePreview(quiz, answers) {
  if (!quiz.preview?.enabled) throw new Error("A preview is not available for this quiz");
  const questions = previewQuestions(quiz);
  const values = valuesFor(quiz, questions.map((question) => question.id), answers);
  const scores = Object.fromEntries(quiz.scoring.dimensions.map((dimension) => [
    dimension.id,
    dimension.questionIds.reduce((sum, id) => {
      const index = questions.findIndex((question) => question.id === id);
      return sum + (index < 0 ? 0 : values[index]);
    }, 0)
  ]));
  const leading = [...quiz.scoring.dimensions].sort((a, b) => scores[b.id] - scores[a.id])[0];
  const teaser = quiz.preview.teaser;
  return { heading: teaser.heading, observation: teaser.observations[leading.id], uncertainty: teaser.uncertainty, next: teaser.next };
}

export function evaluateQuiz(quiz, answers) {
  const values = valuesFor(quiz, quiz.questions.map((question) => question.id), answers);
  const scores = Object.fromEntries(quiz.scoring.dimensions.map((dimension) => [
    dimension.id,
    dimension.questionIds.reduce((sum, id) => sum + values[quiz.questions.findIndex((question) => question.id === id)], 0)
  ]));
  const leading = [...quiz.scoring.dimensions].sort((a, b) => scores[b.id] - scores[a.id])[0];
  return { scores, result: quiz.results.find((result) => result.id === leading.resultId) };
}
