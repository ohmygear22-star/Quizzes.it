import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { quizzes } from "../v31/index.js";
import { startAssessment, currentQuestion, answerQuestion, unlockAssessment } from "../v31/engine.js";

const idForLabel = (quiz, label) => quiz.hypotheses.find((hypothesis) => hypothesis.label === label)?.id;
const choose = (question, scores, primary, secondary, mixed) => {
  const options = [...question.options];
  if (!mixed) {
    const competitor = Object.keys(scores).filter((id) => id !== primary).sort((a, b) => scores[b] - scores[a] || a.localeCompare(b))[0];
    return options.sort((a, b) => b.evidence[primary] - a.evidence[primary] || (b.evidence[primary] - b.evidence[competitor]) - (a.evidence[primary] - a.evidence[competitor]) || a.id.localeCompare(b.id))[0].id;
  }
  const meaningful = options.filter((option) => option.evidence[primary] > 0 || option.evidence[secondary] > 0);
  const candidates = meaningful.length ? meaningful : options;
  return candidates.sort((a, b) => {
    const imbalanceA = Math.abs(scores[primary] + a.evidence[primary] - scores[secondary] - a.evidence[secondary]);
    const imbalanceB = Math.abs(scores[primary] + b.evidence[primary] - scores[secondary] - b.evidence[secondary]);
    const outsideA = Math.abs(a.evidence.H1) + Math.abs(a.evidence.H2) + Math.abs(a.evidence.H3) + Math.abs(a.evidence.H4) - Math.abs(a.evidence[primary]) - Math.abs(a.evidence[secondary]);
    const outsideB = Math.abs(b.evidence.H1) + Math.abs(b.evidence.H2) + Math.abs(b.evidence.H3) + Math.abs(b.evidence.H4) - Math.abs(b.evidence[primary]) - Math.abs(b.evidence[secondary]);
    return imbalanceA - imbalanceB || (b.evidence[primary] + b.evidence[secondary]) - (a.evidence[primary] + a.evidence[secondary]) || outsideA - outsideB || a.id.localeCompare(b.id);
  })[0].id;
};
function simulate(quiz, persona) {
  const primaryTarget = idForLabel(quiz, persona["Expected Primary"]);
  const secondaryTarget = idForLabel(quiz, persona["Expected Secondary"]);
  const mixedIntent = persona.Persona === "Mixed / ambiguous";
  let state = startAssessment(quiz.id);
  while (state.status !== "payment-required") {
    const question = currentQuestion(state);
    state = answerQuestion(state, { questionId: question.id, optionId: choose(question, state.scores, primaryTarget, secondaryTarget, mixedIntent) });
  }
  state = unlockAssessment(state);
  while (!state.completion.shouldStop) {
    const question = currentQuestion(state);
    state = answerQuestion(state, { questionId: question.id, optionId: choose(question, state.scores, primaryTarget, secondaryTarget, mixedIntent) });
  }
  const expectedPrimary = primaryTarget, expectedMixed = mixedIntent;
  const pairMatches = mixedIntent ? [state.primary, state.secondary].includes(primaryTarget) && [state.primary, state.secondary].includes(secondaryTarget) : state.primary === expectedPrimary;
  const status = pairMatches && state.mixedProfile === expectedMixed ? "PASS" : "FAIL";
  return {
    quiz: quiz.id, persona: persona.Persona, expectedPrimary, expectedSecondary: secondaryTarget,
    answers: state.answers, questionCount: state.answers.length, finalScores: state.scores,
    primary: state.primary, secondary: state.secondary, leadMargin: state.leadMargin,
    mixedProfile: state.mixedProfile, stopReason: state.completion.reason,
    resultBlueprint: state.result.blueprint.quizId + "/" + state.result.blueprint.primary,
    distinctAnsweredDomains: new Set(state.answers.map((answer) => quiz.questions.find((question) => question.id === answer.questionId).scenarioDomain)).size,
    stability: state.rankingHistory.slice(-3).map((entry) => entry.uniqueLeader),
    evidenceIntegrity: state.result.evidenceMoments.every((moment) => state.answers.some((answer) => answer.questionId === moment.questionId && answer.optionId === moment.optionId)),
    status,
  };
}

test("all 15 authoritative personas run deterministically with source immutable", () => {
  const before = JSON.stringify(quizzes);
  const report = quizzes.flatMap((quiz) => quiz.qaPersonas.map((persona) => simulate(quiz, persona)));
  fs.mkdirSync(new URL("./output/", import.meta.url), { recursive: true });
  fs.writeFileSync(new URL("./output/v31-persona-report.json", import.meta.url), JSON.stringify({ sourceVersion: "3.1", personas: report }, null, 2));
  assert.equal(report.length, 15);
  assert.equal(report.every((item) => item.evidenceIntegrity), true);
  assert.equal(report.every((item) => item.questionCount <= byId(item.quiz).stopping.maxTotal), true);
  assert.equal(JSON.stringify(quizzes), before);
});
const byId = (id) => quizzes.find((quiz) => quiz.id === id);

test("persona report preserves every authoritative intent row", () => {
  const report = JSON.parse(fs.readFileSync(new URL("./output/v31-persona-report.json", import.meta.url))).personas;
  assert.equal(report.length, 15);
  assert.equal(new Set(report.map((item) => item.quiz + "/" + item.persona)).size, 15);
});

