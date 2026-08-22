export function validateQuiz(quiz) {
  const errors = [];
  if (!quiz || typeof quiz !== "object") return ["Quiz must be an object"];
  for (const field of ["id", "slug", "version", "status", "metadata", "offers", "questions", "scoring", "results"]) if (quiz[field] == null) errors.push("Missing " + field);
  if (!/^[a-z0-9-]+$/.test(quiz.id || "")) errors.push("id must use lowercase letters, digits, and hyphens");
  if (!/^[a-z0-9-]+$/.test(quiz.slug || "")) errors.push("slug must use lowercase letters, digits, and hyphens");
  if (!Number.isInteger(quiz.version) || quiz.version < 1) errors.push("version must be a positive integer");
  if (!["draft", "review", "live", "retired"].includes(quiz.status)) errors.push("Invalid status");
  if (!Array.isArray(quiz.offers) || !quiz.offers.length) errors.push("At least one offer is required");
  const ids = new Set();
  for (const offer of quiz.offers || []) { if (!offer.id || ids.has(offer.id) || !Number.isInteger(offer.amount) || offer.amount < 0 || !offer.currency) errors.push("Invalid or duplicate offer"); ids.add(offer.id); }
  const questionIds = new Set();
  for (const question of quiz.questions || []) {
    if (!question.id || questionIds.has(question.id) || !question.text || !Array.isArray(question.options) || question.options.length < 2) errors.push("Invalid or duplicate question");
    questionIds.add(question.id);
    const optionIds = new Set();
    for (const option of question.options || []) if (!option.id || optionIds.has(option.id) || !option.text || !Number.isFinite(option.value)) errors.push("Invalid or duplicate option"); else optionIds.add(option.id);
  }
  if (quiz.scoring?.method !== "profile-sum") errors.push("Only profile-sum scoring is supported in Phase 2");
  const resultIds = new Set((quiz.results || []).map((result) => result.id));
  for (const dimension of quiz.scoring?.dimensions || []) {
    if (!dimension.id || !dimension.resultId || !resultIds.has(dimension.resultId) || !Array.isArray(dimension.questionIds) || dimension.questionIds.some((id) => !questionIds.has(id))) errors.push("Invalid scoring dimension");
  }
  if (!quiz.branching || !Array.isArray(quiz.branching.rules)) errors.push("branching.rules must be an array");
  return [...new Set(errors)];
}

export function assertValidQuiz(quiz) { const errors = validateQuiz(quiz); if (errors.length) throw new Error("Invalid quiz " + (quiz?.id || "unknown") + ": " + errors.join("; ")); return quiz; }
export function publicQuiz(quiz) { return { id: quiz.id, slug: quiz.slug, version: quiz.version, status: quiz.status, metadata: quiz.metadata, offers: quiz.offers, seo: quiz.seo }; }
export function evaluateQuiz(quiz, answers) {
  if (!Array.isArray(answers) || answers.length !== quiz.questions.length) throw new Error("Please answer every question");
  const values = quiz.questions.map((question, index) => { const option = question.options.find((item) => item.id === answers[index]); if (!option) throw new Error("Please answer every question"); return option.value; });
  const scores = Object.fromEntries(quiz.scoring.dimensions.map((dimension) => [dimension.id, dimension.questionIds.reduce((sum, id) => sum + values[quiz.questions.findIndex((question) => question.id === id)], 0)]));
  const leading = [...quiz.scoring.dimensions].sort((a, b) => scores[b.id] - scores[a.id])[0];
  return { scores, result: quiz.results.find((result) => result.id === leading.resultId) };
}
