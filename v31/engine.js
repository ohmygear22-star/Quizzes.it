import { byId } from "./index.js";
import { applyEvidence, emptyScores, rankScores, rankingHistoryEntry } from "./scoring.js";
import { selectNextQuestion, samePair } from "./selector.js";
import { evaluateCompletion } from "./stopping.js";
import { buildResult } from "./result-builder.js";

const quizFor = (quizId) => {
  const quiz = byId.get(quizId);
  if (!quiz) throw new Error("Unknown V3.1 quiz: " + quizId);
  return quiz;
};
const askedQuestions = (quiz, answers) => answers.map((answer) => quiz.questions.find((question) => question.id === answer.questionId));
const rankedState = (scores, questionId) => {
  const ranking = rankScores(scores);
  return { ranking, history: rankingHistoryEntry(questionId, ranking) };
};
function selection(quiz, state) {
  const ranking = rankScores(state.scores);
  const remaining = quiz.questions.filter((question) => question.stage === "paid" && !state.askedQuestionIds.includes(question.id));
  const pairCount = remaining.filter((question) => samePair(question.designedPair, [ranking.primary, ranking.secondary])).length;
  const question = selectNextQuestion(quiz, { scores: state.scores, askedQuestionIds: state.askedQuestionIds, askedQuestions: askedQuestions(quiz, state.answers) });
  return question ? { id: question.id, trace: { answerCount: state.answers.length, scoresBefore: { ...state.scores }, topTwo: [ranking.primary, ranking.secondary], mode: pairCount ? "pair-specific" : "fallback", eligibleCandidateCount: pairCount || remaining.length, selectedQuestionId: question.id, scenarioDomain: question.scenarioDomain } } : null;
}
function advancePaid(quiz, state) {
  const completion = evaluateCompletion(quiz, { answers: state.answers, scores: state.scores, rankingHistory: state.rankingHistory });
  if (completion.shouldStop) {
    const result = buildResult({ quiz, answers: state.answers, scores: state.scores, primary: completion.primary, secondary: completion.secondary, leadMargin: completion.leadMargin, mixedProfile: completion.mixedProfile, completion });
    return { ...state, completion, mixedProfile: completion.mixedProfile, result, status: "completed", nextQuestionId: null };
  }
  const next = selection(quiz, state);
  if (!next) throw new Error("No remaining paid question before completion");
  return { ...state, completion, status: "paid-active", nextQuestionId: next.id, selectionTrace: [...state.selectionTrace, next.trace] };
}

export function startAssessment(quizId) {
  const quiz = quizFor(quizId);
  return { quizId, sourceVersion: quiz.version, answers: [], askedQuestionIds: [], scores: emptyScores(), rankingHistory: [], primary: null, secondary: null, leadMargin: 0, paidUnlocked: false, status: "preview-active", nextQuestionId: quiz.questions.find((question) => question.stage === "preview")?.id || null, completion: { shouldStop: false, reason: "not-started" }, mixedProfile: false, result: null, selectionTrace: [] };
}
export function currentQuestion(state) {
  if (!state.nextQuestionId) return null;
  return quizFor(state.quizId).questions.find((question) => question.id === state.nextQuestionId) || null;
}
export function unlockAssessment(state) {
  if (state.status !== "payment-required") throw new Error("Assessment is not ready for paid unlock");
  return advancePaid(quizFor(state.quizId), { ...state, paidUnlocked: true });
}
export function answerQuestion(state, answer) {
  const quiz = quizFor(state.quizId);
  const expected = currentQuestion(state);
  if (!expected) throw new Error("Assessment has no question available");
  if (answer.questionId !== expected.id) throw new Error("Expected question: " + expected.id);
  if (state.askedQuestionIds.includes(answer.questionId)) throw new Error("Duplicate answer: " + answer.questionId);
  const option = expected.options.find((item) => item.id === answer.optionId);
  if (!option) throw new Error("Unknown option: " + answer.optionId);
  const scores = applyEvidence(state.scores, option.evidence);
  const ranked = rankedState(scores, expected.id);
  const nextState = { ...state, answers: [...state.answers, { questionId: expected.id, optionId: option.id }], askedQuestionIds: [...state.askedQuestionIds, expected.id], scores, rankingHistory: [...state.rankingHistory, ranked.history], primary: ranked.ranking.primary, secondary: ranked.ranking.secondary, leadMargin: ranked.ranking.leadMargin };
  if (nextState.answers.length < 5) {
    const nextPreview = quiz.questions.find((question) => question.stage === "preview" && !nextState.askedQuestionIds.includes(question.id));
    return { ...nextState, nextQuestionId: nextPreview.id };
  }
  if (nextState.answers.length === 5) return { ...nextState, status: "payment-required", nextQuestionId: null, completion: evaluateCompletion(quiz, { answers: nextState.answers, scores, rankingHistory: nextState.rankingHistory }) };
  if (!nextState.paidUnlocked) throw new Error("Paid unlock required");
  return advancePaid(quiz, nextState);
}
