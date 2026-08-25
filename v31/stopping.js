import { rankScores } from "./scoring.js";

function selectedAnswers(quiz, answers) {
  return answers.map((answer) => {
    const question = quiz.questions.find((item) => item.id === answer.questionId);
    if (!question) throw new Error("Unknown question: " + answer.questionId);
    const option = question.options.find((item) => item.id === answer.optionId);
    if (!option) throw new Error("Unknown option: " + answer.optionId);
    return { question, option };
  });
}

export function evaluateCompletion(quiz, { answers = [], scores, rankingHistory = [] }) {
  const config = quiz.stopping;
  if (!config) throw new Error("Missing stopping configuration for quiz: " + quiz.id);

  const ranking = rankScores(scores);
  const selected = selectedAnswers(quiz, answers);
  const strongPrimaryCount = selected.filter(({ option }) => option.evidence[ranking.primary] === 2).length;
  const positiveDomainCount = new Set(selected.filter(({ option }) => option.evidence[ranking.primary] >= 1).map(({ question }) => question.scenarioDomain)).size;
  const latestLeaders = rankingHistory.slice(-config.primaryStabilityWindow).map((entry) => entry.uniqueLeader);
  const stablePrimary = latestLeaders.length === config.primaryStabilityWindow && latestLeaders.every((leader) => leader !== null && leader === ranking.primary);
  const gates = {
    leadMargin: ranking.leadMargin >= config.leadMarginToStop,
    strongPrimary: strongPrimaryCount >= config.minStrongPrimaryAnswers,
    positiveDomains: positiveDomainCount >= config.minDistinctEvidenceDomains,
    stablePrimary,
  };
  const answeredCount = answers.length;
  const atMaximum = answeredCount >= config.maxTotal;
  const criteriaMet = answeredCount >= config.minTotal && Object.values(gates).every(Boolean);
  const shouldStop = atMaximum || criteriaMet;

  return {
    shouldStop,
    reason: atMaximum ? "maximum-reached" : criteriaMet ? "criteria-met" : answeredCount < config.minTotal ? "below-minimum" : "criteria-not-met",
    answeredCount,
    primary: ranking.primary,
    secondary: ranking.secondary,
    leadMargin: ranking.leadMargin,
    strongPrimaryCount,
    positiveDomainCount,
    stablePrimary,
    mixedProfile: atMaximum && ranking.leadMargin < config.leadMarginToStop,
    gates,
  };
}
