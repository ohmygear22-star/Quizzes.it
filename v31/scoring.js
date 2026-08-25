export const emptyScores = () => ({ H1: 0, H2: 0, H3: 0, H4: 0 });
export function applyEvidence(scores, evidence) {
  return Object.fromEntries(Object.keys(emptyScores()).map((id) => [id, Number(scores[id] || 0) + Number(evidence[id] || 0)]));
}
export function scoreAnswers(quiz, answers) {
  return answers.reduce((scores, answer) => {
    const question = quiz.questions.find((item) => item.id === answer.questionId);
    if (!question) throw new Error("Unknown question: " + answer.questionId);
    const option = question.options.find((item) => item.id === answer.optionId);
    if (!option) throw new Error("Unknown option: " + answer.optionId);
    return applyEvidence(scores, option.evidence);
  }, emptyScores());
}

export function rankScores(scores) {
  const ranked = Object.keys(emptyScores()).sort((left, right) => Number(scores[right] || 0) - Number(scores[left] || 0) || left.localeCompare(right));
  const primary = ranked[0], secondary = ranked[1];
  const leadMargin = Number(scores[primary] || 0) - Number(scores[secondary] || 0);
  return { ranked, primary, secondary, leadMargin, uniqueLeader: leadMargin === 0 ? null : primary };
}
export function rankingHistoryEntry(afterQuestionId, ranking) {
  return { afterQuestionId, ranked: [...ranking.ranked], uniqueLeader: ranking.uniqueLeader };
}
